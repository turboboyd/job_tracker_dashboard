import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button, FormField, Input, TextArea } from "src/shared/ui";

import type { CreateFormState } from "../model/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  form: CreateFormState;
  onChange: <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => void;
  onCreate: () => void;
  canSubmit: boolean;
  isCreating: boolean;
};

export function CreateApplicationDialog(props: Props) {
  const { isOpen, onClose, form, onChange, onCreate, canSubmit, isCreating } = props;
  const { t } = useTranslation();
  const wasCreatingRef = useRef(false);

  // Close dialog when creation completes successfully (isCreating goes false)
  useEffect(() => {
    if (wasCreatingRef.current && !isCreating) {
      onClose();
    }
    wasCreatingRef.current = isCreating;
  }, [isCreating, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="max-w-[500px] w-full mx-auto mt-16 rounded-[16px] border border-border bg-background shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold text-foreground">
            {(t("applicationsPage.create.title", { defaultValue: "New Application", returnObjects: false }) as string)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            label={(t("applicationsPage.create.company", { defaultValue: "Company", returnObjects: false }) as string)}
            required
          >
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                value={form.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("companyName", e.target.value)
                }
                placeholder={(t("applicationsPage.create.companyPh", { defaultValue: "e.g. ACME GmbH", returnObjects: false }) as string)}
              />
            )}
          </FormField>

          <FormField
            label={(t("applicationsPage.create.role", { defaultValue: "Role", returnObjects: false }) as string)}
            required
          >
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                value={form.roleTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("roleTitle", e.target.value)
                }
                placeholder={(t("applicationsPage.create.rolePh", { defaultValue: "e.g. Frontend Developer", returnObjects: false }) as string)}
              />
            )}
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label={(t("applicationsPage.create.url", { defaultValue: "Vacancy URL", returnObjects: false }) as string)}
            >
              {(p) => (
                <Input
                  id={p.id}
                  aria-describedby={p.describedBy}
                  aria-invalid={p.invalid}
                  value={form.vacancyUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange("vacancyUrl", e.target.value)
                  }
                  placeholder={(t("applicationsPage.create.urlPh", { defaultValue: "https://…", returnObjects: false }) as string)}
                />
              )}
            </FormField>
          </div>

          <FormField
            label={(t("applicationsPage.create.source", { defaultValue: "Source", returnObjects: false }) as string)}
          >
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                value={form.source}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("source", e.target.value)
                }
                placeholder={(t("applicationsPage.create.sourcePh", { defaultValue: "LinkedIn / Indeed / Company site", returnObjects: false }) as string)}
              />
            )}
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label={(t("applicationsPage.create.desc", { defaultValue: "Description (optional)", returnObjects: false }) as string)}
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
                  placeholder={(t("applicationsPage.create.descPh", { defaultValue: "Paste vacancy text to improve matching…", returnObjects: false }) as string)}
                />
              )}
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {(t("common.cancel", { defaultValue: "Cancel", returnObjects: false }) as string)}
          </button>
          <Button onClick={onCreate} disabled={!canSubmit || isCreating}>
            {isCreating
              ? (t("applicationsPage.create.creating", { defaultValue: "Creating…", returnObjects: false }) as string)
              : (t("applicationsPage.create.createBtn", { defaultValue: "Create", returnObjects: false }) as string)}
          </Button>
        </div>
      </div>
    </div>
  );
}
