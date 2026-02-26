import React from "react";
import { useTranslation } from "react-i18next";

import { Button, FormField, Input, TextArea } from "src/shared/ui";

import type { CreateFormState } from "../model/types";

type Props = {
  form: CreateFormState;
  onChange: <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => void;
  onCreate: () => void;
  canSubmit: boolean;
  isCreating: boolean;
};

export function CreateApplicationCard(props: Props) {
  const { t } = useTranslation();
  const { form, onChange, onCreate, canSubmit, isCreating } = props;

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-3 text-lg font-semibold">
        {((t("applicationsPage.create.title", { defaultValue: "New application", returnObjects: false }) ?? "New application") as string)}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label={((t("applicationsPage.create.company", { defaultValue: "Company", returnObjects: false }) ?? "Company") as string)} required>
          {(p) => (
            <Input
              id={p.id}
              aria-describedby={p.describedBy}
              aria-invalid={p.invalid}
              value={form.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange("companyName", e.target.value)
              }
              placeholder={((t("applicationsPage.create.companyPh", { defaultValue: "e.g. ACME GmbH", returnObjects: false }) ?? "e.g. ACME GmbH") as string)}
            />
          )}
        </FormField>

        <FormField label={((t("applicationsPage.create.role", { defaultValue: "Role", returnObjects: false }) ?? "Role") as string)} required>
          {(p) => (
            <Input
              id={p.id}
              aria-describedby={p.describedBy}
              aria-invalid={p.invalid}
              value={form.roleTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange("roleTitle", e.target.value)
              }
              placeholder={t(
                "applicationsPage.create.rolePh",
                "e.g. Frontend Developer"
              )}
            />
          )}
        </FormField>

        <div className="md:col-span-2">
          <FormField label={((t("applicationsPage.create.url", { defaultValue: "Vacancy URL", returnObjects: false }) ?? "Vacancy URL") as string)}>
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                value={form.vacancyUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("vacancyUrl", e.target.value)
                }
                placeholder={((t("applicationsPage.create.urlPh", { defaultValue: "https://…", returnObjects: false }) ?? "https://…") as string)}
              />
            )}
          </FormField>
        </div>

        <FormField label={((t("applicationsPage.create.source", { defaultValue: "Source", returnObjects: false }) ?? "Source") as string)}>
          {(p) => (
            <Input
              id={p.id}
              aria-describedby={p.describedBy}
              aria-invalid={p.invalid}
              value={form.source}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange("source", e.target.value)
              }
              placeholder={t(
                "applicationsPage.create.sourcePh",
                "LinkedIn / Indeed / Company site"
              )}
            />
          )}
        </FormField>

        <div className="md:col-span-2">
          <FormField
            label={((t("applicationsPage.create.desc", { defaultValue: "Description (optional)", returnObjects: false }) ?? "Description (optional)") as string)}
          >
            {(p) => (
              <TextArea
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                value={form.rawDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChange("rawDescription", e.target.value)
                }
                placeholder={t(
                  "applicationsPage.create.descPh",
                  "Paste vacancy text to improve matching…"
                )}
              />
            )}
          </FormField>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button onClick={onCreate} disabled={!canSubmit || isCreating}>
          {isCreating
            ? ((t("applicationsPage.create.creating", { defaultValue: "Creating…", returnObjects: false }) ?? "Creating…") as string)
            : ((t("applicationsPage.create.createBtn", { defaultValue: "Create", returnObjects: false }) ?? "Create") as string)}
        </Button>
      </div>
    </div>
  );
}
