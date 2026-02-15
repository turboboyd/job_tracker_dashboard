import { Formik } from "formik";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";

import { useCreateMatchMutation } from "src/entities/loopMatch/api";
import type { LoopMatchStatus } from "src/entities/loopMatch/model/types";
import { getErrorMessage } from "src/shared/lib";
import { Button, InlineError, Input, Modal, TextArea } from "src/shared/ui";
import { FormField } from "src/shared/ui/Form/FormField/FormField";

import { detectPlatformFromUrl } from "../../lib/detectPlatformFromUrl";
import type { LoopPlatform } from "../../model";
import { LOOP_MATCH_STATUSES, LOOP_PLATFORMS } from "../../model/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
const statusValues = LOOP_MATCH_STATUSES.map((s) => s.value) as LoopMatchStatus[];

function makeSchema(t: TFunction) {
  return Yup.object({
    title: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.titleRequired", { defaultValue: "Title is required" })
      )
      .required(
        t("loops.validation.titleRequired", { defaultValue: "Title is required" })
      ),

    company: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.companyRequired", { defaultValue: "Company is required" })
      )
      .required(
        t("loops.validation.companyRequired", { defaultValue: "Company is required" })
      ),

    location: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.locationRequired", { defaultValue: "Location is required" })
      )
      .required(
        t("loops.validation.locationRequired", { defaultValue: "Location is required" })
      ),

    platform: Yup.mixed<LoopPlatform>()
      .oneOf(platformValues)
      .required(
        t("loops.validation.platformRequired", { defaultValue: "Platform is required" })
      ),

    url: Yup.string()
      .trim()
      .required(
        t("loops.validation.urlRequired", { defaultValue: "Job URL is required" })
      )
      .test(
        "is-url",
        t("loops.validation.invalidUrl", { defaultValue: "Invalid URL" }),
        (v) => Boolean(tryParseUrl(v ?? ""))
      ),

    description: Yup.string()
      .trim()
      .min(
        1,
        t("loops.validation.descriptionRequired", { defaultValue: "Description is required" })
      )
      .required(
        t("loops.validation.descriptionRequired", { defaultValue: "Description is required" })
      ),

    status: Yup.mixed<LoopMatchStatus>()
      .oneOf(statusValues)
      .required(
        t("loops.validation.statusRequired", { defaultValue: "Status is required" })
      ),

    matchedAt: Yup.string().trim().required(),
  }) as Yup.ObjectSchema<Values>;
}

export function AddMatchModal({
  open,
  onOpenChange,
  loopId,
  defaultPlatform,
}: Props) {
  const { t } = useTranslation();
  const [createMatch, st] = useCreateMatchMutation();

  const schema = useMemo(() => makeSchema(t), [t]);

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
      title={t("loops.addMatch", { defaultValue: "Add match" })}
      description={t("loops.addMatchDescription", {
        defaultValue: "Paste the job URL and fill details. This saves a match to your loop.",
      })}
    >
      <Formik<Values>
        initialValues={initial}
        enableReinitialize
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);

          try {
            await createMatch({
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
            helpers.setStatus(
              getErrorMessage(e) ||
                t("loops.failedToSaveMatch", { defaultValue: "Failed to save match" })
            );
          }
        }}
      >
        {(f) => {
          const commonError =
            (typeof f.status === "string" ? f.status : undefined) ||
            (st.isError ? getErrorMessage(st.error) : undefined);

          const canSubmit = !disabled && f.dirty;

          return (
            <form onSubmit={f.handleSubmit} className="space-y-4">
              {commonError ? <InlineError message={commonError} /> : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label={t("loops.jobTitle", { defaultValue: "Job title" })}
                  required
                  error={
                    f.touched.title ? (f.errors.title as string | undefined) : undefined
                  }
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="title"
                      value={f.values.title}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      placeholder={t("loops.jobTitlePlaceholder", {
                        defaultValue: "Frontend Developer",
                      })}
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField
                  label={t("loops.company", { defaultValue: "Company" })}
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
                      placeholder={t("loops.companyPlaceholder", { defaultValue: "Acme GmbH" })}
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField
                  label={t("loops.location", { defaultValue: "Location" })}
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
                      placeholder={t("loops.locationJobPlaceholder", { defaultValue: "Berlin / Remote" })}
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField label={t("loops.platform", { defaultValue: "Platform" })} required>
                  {({ id, describedBy }) => (
                    <select
                      id={id}
                      name="platform"
                      value={f.values.platform}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      aria-describedby={describedBy}
                      disabled={disabled}
                      className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground"
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
                  label={t("loops.jobUrl", { defaultValue: "Job URL" })}
                  required
                  hint={t("loops.jobUrlHint", {
                    defaultValue: "You can paste without https:// (it will be normalized on save).",
                  })}
                  error={f.touched.url ? (f.errors.url as string | undefined) : undefined}
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
                      placeholder={t("loops.jobUrlPlaceholder", { defaultValue: "company.com/job" })}
                      state={invalid ? "error" : "default"}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                      disabled={disabled}
                    />
                  )}
                </FormField>

                <FormField label={t("loops.status", { defaultValue: "Status" })} required>
                  {({ id, describedBy }) => (
                    <select
                      id={id}
                      name="status"
                      value={f.values.status}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      aria-describedby={describedBy}
                      disabled={disabled}
                      className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground"
                    >
                      {LOOP_MATCH_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {t(`loops.status.${s.value}`, { defaultValue: s.label })}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>

              <FormField
                label={t("loops.description", { defaultValue: "Description" })}
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
                    placeholder={t("loops.descriptionPlaceholder", {
                      defaultValue: "Paste key parts of the job description here…",
                    })}
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
                  {disabled
                    ? t("loops.saving", { defaultValue: "Saving..." })
                    : t("loops.saveMatch", { defaultValue: "Save match" })}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  shape="lg"
                  onClick={() => onOpenChange(false)}
                  disabled={disabled}
                >
                  {t("loops.cancel", { defaultValue: "Cancel" })}
                </Button>
              </div>
            </form>
          );
        }}
      </Formik>
    </Modal>
  );
}
