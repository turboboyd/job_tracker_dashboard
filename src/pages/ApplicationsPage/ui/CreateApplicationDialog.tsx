import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import { joinTitles } from "src/entities/loop/lib/format";
import {
  previewVacancyImportViaRest,
  type VacancyImportPreview,
} from "src/features/applications/rest/queries";
import { Button, FormField, Input, Select, TextArea } from "src/shared/ui";

import type { CreateFormState } from "../model/types";
import {
  applyVacancyImportPreviewToForm,
  applyVacancyImportFallbackToForm,
  canRunVacancyImportPreview,
  getVacancyImportFailureCode,
  normalizeCreateApplicationInitialMode,
  shouldPreselectCreateApplicationLoop,
  type CreateApplicationInitialMode,
} from "../model/vacancyImport.helpers";

type CreateMode = CreateApplicationInitialMode;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  form: CreateFormState;
  onChange: <K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K],
  ) => void;
  onCreate: () => void;
  canSubmit: boolean;
  isCreating: boolean;
  activeLoops: Loop[];
  isLoadingLoops: boolean;
  onSelectLoop: (loopId: string) => void;
  onCreateLoopRequested: () => void;
  initialLoopId?: string | null;
  initialMode?: CreateMode | string | null;
};

function getLoopOptionLabel(loop: Loop): string {
  const titles = joinTitles(loop.titles);
  return titles ? `${loop.name} · ${titles}` : loop.name;
}

function applyPreview(
  form: CreateFormState,
  preview: VacancyImportPreview,
  onChange: Props["onChange"],
): void {
  const next = applyVacancyImportPreviewToForm(form, preview);
  onChange("vacancyUrl", next.vacancyUrl);
  onChange("source", next.source);
  onChange("companyName", next.companyName);
  onChange("roleTitle", next.roleTitle);
  onChange("locationText", next.locationText);
  onChange("rawDescription", next.rawDescription);
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- Route-driven import preview, fallback, and create state transitions intentionally remain together to preserve submit and data-flow behavior.
export function CreateApplicationDialog(props: Props) {
  const {
    isOpen,
    onClose,
    form,
    onChange,
    onCreate,
    canSubmit,
    isCreating,
    activeLoops,
    isLoadingLoops,
    onSelectLoop,
    onCreateLoopRequested,
    initialLoopId,
    initialMode,
  } = props;
  const { t } = useTranslation();
  const wasCreatingRef = useRef(false);

  const [mode, setMode] = useState<CreateMode>("manual");
  const [isImporting, setIsImporting] = useState(false);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [previewedUrl, setPreviewedUrl] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const loopOptions = useMemo(
    () =>
      activeLoops.map((loop) => ({
        value: loop.id,
        label: getLoopOptionLabel(loop),
      })),
    [activeLoops],
  );
  const hasActiveLoops = activeLoops.length > 0;
  const selectedLoopIsSelectable = loopOptions.some((option) => option.value === form.loopId);
  const trimmedVacancyUrl = form.vacancyUrl.trim();
  const hasCurrentPreview =
    mode === "import" && previewedUrl === trimmedVacancyUrl;

  useEffect(() => {
    if (wasCreatingRef.current && !isCreating) {
      onClose();
    }
    wasCreatingRef.current = isCreating;
  }, [isCreating, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setMode(normalizeCreateApplicationInitialMode(initialMode));
    setImportWarning(null);
    setImportWarnings([]);
    setPreviewedUrl(null);
    setFallbackUrl(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const shouldSelect = shouldPreselectCreateApplicationLoop({
      currentLoopId: form.loopId,
      initialLoopId,
      selectableLoopIds: activeLoops.map((loop) => loop.id),
    });
    if (shouldSelect && initialLoopId) onSelectLoop(initialLoopId);
  }, [activeLoops, form.loopId, initialLoopId, isOpen, onSelectLoop]);

  if (!isOpen) return null;

  async function handleImportPreview() {
    if (
      !canRunVacancyImportPreview({
        loopId: form.loopId,
        url: form.vacancyUrl,
        isImporting,
      })
    )
      return;

    setIsImporting(true);
    setImportWarning(null);
    setImportWarnings([]);
    setFallbackUrl(null);
    try {
      const preview = await previewVacancyImportViaRest(trimmedVacancyUrl);
      applyPreview(form, preview, onChange);
      setPreviewedUrl(preview.sourceUrl.trim());
      setImportWarnings(preview.warnings);
    } catch (error: unknown) {
      const next = applyVacancyImportFallbackToForm(form, trimmedVacancyUrl);
      onChange("vacancyUrl", next.vacancyUrl);
      onChange("source", next.source);
      setImportWarning(
        getVacancyImportFailureCode(error) === "invalidUrl"
          ? t(
              "applicationsPage.import.invalidUrl",
              "This link can't be imported. Check the URL or fill in the application manually.",
            )
          : t(
              "applicationsPage.import.fallback",
              "Could not automatically extract data from this page. Some sites block automated reading of vacancies. You can keep the link and fill in the fields manually.",
            ),
      );
      setFallbackUrl(next.vacancyUrl);
      setPreviewedUrl(null);
    } finally {
      setIsImporting(false);
    }
  }

  function handleModeChange(nextMode: CreateMode) {
    setMode(nextMode);
    setImportWarning(null);
    setImportWarnings([]);
    setPreviewedUrl(null);
    setFallbackUrl(null);
  }

  function handleVacancyUrlChange(value: string) {
    onChange("vacancyUrl", value);
    setImportWarning(null);
    setImportWarnings([]);
    setPreviewedUrl(null);
    setFallbackUrl(null);
  }

  const previewDisabled = !canRunVacancyImportPreview({
    loopId: form.loopId,
    url: form.vacancyUrl,
    isImporting,
  });
  const importNeedsPreview = mode === "import" && !hasCurrentPreview;
  const hasImportFallback = mode === "import" && fallbackUrl === trimmedVacancyUrl;
  const createButtonDisabled =
    !canSubmit ||
    isCreating ||
    !hasActiveLoops ||
    !selectedLoopIsSelectable ||
    (importNeedsPreview && !hasImportFallback);
  const createButtonLabel = isCreating
    ? t("applicationsPage.create.creating", "Creating…")
    : t("applicationsPage.create.createBtn", "Создать");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-16 w-full max-w-[560px] rounded-[16px] border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">
            {t("applicationsPage.create.title", "Новая заявка")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoadingLoops ? (
          <div className="mb-4 rounded-[10px] border border-border bg-muted/40 p-3 text-[13px] text-muted-foreground">
            {t("applicationsPage.create.loadingLoops", "Loading search directions…")}
          </div>
        ) : null}

        {!isLoadingLoops && !hasActiveLoops ? (
          <div className="rounded-[12px] border border-amber-300/60 bg-amber-50 p-4 text-[13px] text-amber-900">
            <p className="font-medium">
              {t("applicationsPage.create.noLoopsTitle", "Create a search direction first")}
            </p>
            <p className="mt-1 text-[12.5px] text-amber-800/90">
              {t(
                "applicationsPage.create.noLoopsHint",
                "An application must belong to an active search direction.",
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("applicationsPage.create.cancel", "Cancel")}
              </button>
              <Button onClick={onCreateLoopRequested}>
                {t("applicationsPage.create.goToLoops", "Go to search directions")}
              </Button>
            </div>
          </div>
        ) : null}

        {hasActiveLoops ? (
          <>
            <div className="mb-4 grid grid-cols-2 rounded-[10px] bg-muted p-1 text-[13px]">
              <button
                type="button"
                onClick={() => handleModeChange("manual")}
                className={[
                  "rounded-[8px] px-3 py-1.5 font-medium transition-colors",
                  mode === "manual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {t("applicationsPage.create.manual", "Manual")}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("import")}
                className={[
                  "rounded-[8px] px-3 py-1.5 font-medium transition-colors",
                  mode === "import"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {t("applicationsPage.create.importTab", "Import by link")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField label={t("applicationsPage.create.loopField", "Search direction")} required>
                  {(p) => (
                    <Select
                      id={p.id}
                      aria-describedby={p.describedBy}
                      aria-invalid={p.invalid}
                      value={form.loopId}
                      onChange={onSelectLoop}
                      options={loopOptions}
                      placeholderOption={t("applicationsPage.create.loopPlaceholder", "Select a search direction")}
                      disabled={isLoadingLoops}
                    />
                  )}
                </FormField>
              </div>

              {mode === "import" ? (
                <div className="md:col-span-2 rounded-[12px] border border-border bg-muted/30 p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <FormField
                      label={t("applicationsPage.create.url", "Vacancy URL")}
                      required
                    >
                      {(p) => (
                        <Input
                          id={p.id}
                          aria-describedby={p.describedBy}
                          aria-invalid={p.invalid}
                          value={form.vacancyUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleVacancyUrlChange(e.target.value)
                          }
                          placeholder={t(
                            "applicationsPage.create.urlPh",
                            "https://…",
                          )}
                        />
                      )}
                    </FormField>
                    <div className="flex items-end">
                      <Button
                        onClick={handleImportPreview}
                        disabled={previewDisabled}
                      >
                        {isImporting
                          ? t("applicationsPage.create.importing", "Importing…")
                          : t("applicationsPage.create.import", "Import")}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {t(
                      "applicationsPage.create.importHint",
                      "Import checks one link, fills the preview, and does not create an application until you click Create.",
                    )}
                  </p>
                  {importWarning ? (
                    <div className="mt-3 rounded-[10px] border border-amber-300/60 bg-amber-50 p-3 text-[13px] text-amber-900">
                      {importWarning}
                    </div>
                  ) : null}
                  {importWarnings.length > 0 ? (
                    <div className="mt-3 rounded-[10px] border border-amber-300/60 bg-amber-50 p-3 text-[12.5px] text-amber-900">
                      {importWarnings.join(" · ")}
                    </div>
                  ) : null}
                  {hasCurrentPreview ? (
                    <div className="mt-3 rounded-[10px] border border-emerald-300/60 bg-emerald-50 p-3 text-[12.5px] text-emerald-900">
                      {t(
                        "applicationsPage.create.previewReady",
                        "Preview ready. Check the fields below and click Create to add the application.",
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="md:col-span-2">
                  <FormField
                    label={t("applicationsPage.create.url", "Vacancy URL")}
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
                        placeholder={t(
                          "applicationsPage.create.urlPh",
                          "https://…",
                        )}
                      />
                    )}
                  </FormField>
                </div>
              )}

              <FormField
                label={t("applicationsPage.create.company", "Компания")}
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
                    placeholder={t(
                      "applicationsPage.create.companyPh",
                      "например, ACME GmbH",
                    )}
                  />
                )}
              </FormField>

              <FormField
                label={t("applicationsPage.create.role", "Вакансия")}
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
                    placeholder={t(
                      "applicationsPage.create.rolePh",
                      "например, Frontend Developer",
                    )}
                  />
                )}
              </FormField>

              <FormField label={t("applicationsPage.create.source", "Источник")}>
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
                      "LinkedIn / Indeed / Company site",
                    )}
                  />
                )}
              </FormField>

              <FormField label={t("applicationsPage.create.location", "Location")}>
                {(p) => (
                  <Input
                    id={p.id}
                    aria-describedby={p.describedBy}
                    aria-invalid={p.invalid}
                    value={form.locationText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onChange("locationText", e.target.value)
                    }
                    placeholder={t("applicationsPage.create.locationPh", "Berlin / Remote / Hybrid")}
                  />
                )}
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  label={t(
                    "applicationsPage.create.desc",
                    "Описание (необязательно)",
                  )}
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
                        "Paste vacancy text to improve matching…",
                      )}
                    />
                  )}
                </FormField>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("applicationsPage.create.cancel", "Cancel")}
              </button>
              <Button onClick={onCreate} disabled={createButtonDisabled}>
                {createButtonLabel}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
