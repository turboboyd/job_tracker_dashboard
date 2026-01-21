import { Formik } from "formik";
import React, { useMemo } from "react";
import * as Yup from "yup";

import { useCreateLoopMatchMutation } from "src/entities/loop/api/loopApi";
import { detectPlatformFromUrl } from "src/entities/loop/lib/detectPlatformFromUrl";
import { LOOP_MATCH_STATUSES, LOOP_PLATFORMS } from "src/entities/loop/model/constants";
import { normalizeError } from "src/shared/lib/errors/normalizeError";
import { Modal, Button, Input, TextArea, InlineError } from "src/shared/ui";
import { FormField } from "src/shared/ui/Form/FormField/FormField";

import { LoopMatchStatus, LoopPlatform } from "../../model";


type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  userId: string | null;
  loopId: string;

  defaultPlatform?: LoopPlatform;
};

type Values = {
  title: string;
  company: string;
  location: string;
  platform: LoopPlatform;
  url: string;
  description: string;
  status: LoopMatchStatus;
  matchedAt: string;
};

function isoNow() {
  return new Date().toISOString();
}

function platformOrDefault(p?: LoopPlatform): LoopPlatform {
  return p ?? "linkedin";
}

function tryParseUrl(input: string): URL | null {
  const v = input.trim();
  if (!v) return null;

  try {
    return new URL(v);
  } catch {
    try {
      return new URL(`https://${v}`);
    } catch {
      return null;
    }
  }
}

const platformValues = LOOP_PLATFORMS.map((p) => p.value) as LoopPlatform[];
const statusValues = LOOP_MATCH_STATUSES.map(
  (s) => s.value
) as LoopMatchStatus[];

const schema: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "Title is required")
    .required("Title is required"),
  company: Yup.string()
    .trim()
    .min(2, "Company is required")
    .required("Company is required"),
  location: Yup.string()
    .trim()
    .min(2, "Location is required")
    .required("Location is required"),

  platform: Yup.mixed<LoopPlatform>()
    .oneOf(platformValues)
    .required("Platform is required"),

  url: Yup.string()
    .trim()
    .required("Job URL is required")
    .test("is-url", "Invalid URL", (v) => Boolean(tryParseUrl(v ?? ""))),

  description: Yup.string()
    .trim()
    .min(1, "Description is required")
    .required("Description is required"),

  status: Yup.mixed<LoopMatchStatus>()
    .oneOf(statusValues)
    .required("Status is required"),

  matchedAt: Yup.string().trim().required(),
});

export function AddMatchModal({
  open,
  onOpenChange,
  userId,
  loopId,
  defaultPlatform,
}: Props) {
  const [createMatch, st] = useCreateLoopMatchMutation();

  const initial: Values = useMemo(
    () => ({
      title: "",
      company: "",
      location: "",
      platform: platformOrDefault(defaultPlatform),
      url: "",
      description: "",
      status: "new",
      matchedAt: isoNow(),
    }),
    [defaultPlatform]
  );

  const disabled = st.isLoading;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add match"
      description="Paste the job URL and fill details. This saves a match to your loop."
    >
      <Formik<Values>
        initialValues={initial}
        enableReinitialize
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);

          if (!userId) {
            helpers.setStatus("You must be signed in.");
            return;
          }

          try {
            await createMatch({
              userId,
              loopId,
              title: values.title,
              company: values.company,
              location: values.location,
              platform: values.platform,
              url: values.url,
              description: values.description,
              status: values.status,
              matchedAt: values.matchedAt,
            }).unwrap();

            onOpenChange(false);
          } catch (e) {
            helpers.setStatus(normalizeError(e) || "Failed to save match");
          }
        }}
      >
        {(f) => {
          const commonError =
            (typeof f.status === "string" ? f.status : undefined) ||
            (st.isError ? normalizeError(st.error) : undefined);

          const canSubmit = !disabled && f.dirty;

          return (
            <form onSubmit={f.handleSubmit} className="space-y-4">
              {commonError ? <InlineError message={commonError} /> : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Job title"
                  required
                  error={
                    f.touched.title
                      ? (f.errors.title as string | undefined)
                      : undefined
                  }
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="title"
                      value={f.values.title}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      placeholder="Frontend Developer"
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField
                  label="Company"
                  required
                  error={
                    f.touched.company
                      ? (f.errors.company as string | undefined)
                      : undefined
                  }
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="company"
                      value={f.values.company}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      placeholder="Acme GmbH"
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField
                  label="Location"
                  required
                  error={
                    f.touched.location
                      ? (f.errors.location as string | undefined)
                      : undefined
                  }
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="location"
                      value={f.values.location}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      placeholder="Berlin / Remote"
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField label="Platform" required>
                  {({ id, describedBy }) => (
                    <select
                      id={id}
                      name="platform"
                      value={f.values.platform}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      aria-describedby={describedBy}
                      disabled={disabled}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    >
                      {LOOP_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>

                <FormField
                  label="Job URL"
                  required
                  hint="You can paste without https:// (it will be normalized on save)."
                  error={
                    f.touched.url
                      ? (f.errors.url as string | undefined)
                      : undefined
                  }
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="url"
                      value={f.values.url}
                      onChange={(e) => {
                        const next = e.target.value;
                        f.setFieldValue("url", next);

                        const detected = detectPlatformFromUrl(next);
                        if (detected) f.setFieldValue("platform", detected);
                      }}
                      onBlur={f.handleBlur}
                      placeholder="company.com/job"
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField label="Status" required>
                  {({ id, describedBy }) => (
                    <select
                      id={id}
                      name="status"
                      value={f.values.status}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      aria-describedby={describedBy}
                      disabled={disabled}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    >
                      {LOOP_MATCH_STATUSES.map(
                        (s: { value: string; label: string }) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </FormField>
              </div>

              <FormField
                label="Description"
                required
                error={
                  f.touched.description
                    ? (f.errors.description as string | undefined)
                    : undefined
                }
              >
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    name="description"
                    value={f.values.description}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    placeholder="Paste key parts of the job description here…"
                    state={invalid ? "error" : "default"}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    disabled={disabled}
                  />
                )}
              </FormField>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="default"
                  shadow="sm"
                  shape="lg"
                  disabled={!canSubmit}
                >
                  {disabled ? "Saving..." : "Save match"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  shape="lg"
                  onClick={() => onOpenChange(false)}
                  disabled={disabled}
                >
                  Cancel
                </Button>
              </div>
            </form>
          );
        }}
      </Formik>
    </Modal>
  );
}
