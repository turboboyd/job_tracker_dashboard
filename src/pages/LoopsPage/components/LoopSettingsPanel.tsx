import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import type { UpdateBackendLoopInput } from "src/features/loops";

import {
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  createLoopSettingsDraft,
  mapLoopSettingsDraftToPatch,
  mergeKnownAndSelectedOptions,
  toggleSettingsValue,
  type LoopSettingsDraft,
  type LoopSettingsOption,
} from "./loopSettingsPanel.helpers";

interface LoopSettingsPanelProps {
  loop: Loop;
  onSave: (patch: UpdateBackendLoopInput) => Promise<Loop | void>;
  onPauseResume?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  isPaused?: boolean;
}

type TextAreaField =
  | "keywordsText"
  | "excludedKeywordsText";

const textareaFields: Array<{
  key: TextAreaField;
  labelKey: string;
  fallback: string;
  hintKey: string;
  hintFallback: string;
}> = [
  {
    key: "keywordsText",
    labelKey: "loops.settingsKeywords",
    fallback: "Ключевые слова",
    hintKey: "loops.settingsListHint",
    hintFallback: "Одно значение в строке или через запятую.",
  },
  {
    key: "excludedKeywordsText",
    labelKey: "loops.settingsExcludedKeywords",
    fallback: "Исключённые слова",
    hintKey: "loops.settingsListHint",
    hintFallback: "Одно значение в строке или через запятую.",
  },
];

function SaveStatusSection({
  error,
  saved,
  isSaving,
  t,
}: {
  error: string | null;
  saved: boolean;
  isSaving: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {t("loops.settingsSaveSuccess", "Настройки сохранены.")}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving
            ? t("loops.settingsSaving", "Сохраняем...")
            : t("loops.settingsSave", "Сохранить настройки")}
        </button>
      </div>
    </>
  );
}

export function LoopSettingsPanel({ loop, onSave, onPauseResume, onArchive, isPaused }: LoopSettingsPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<LoopSettingsDraft>(() =>
    createLoopSettingsDraft(loop),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDangerBusy, setIsDangerBusy] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const savedLoopIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (savedLoopIdRef.current === loop.id) {
      savedLoopIdRef.current = null;
      return;
    }

    setDraft(createLoopSettingsDraft(loop));
    setError(null);
    setSaved(false);
  }, [loop]);

  const updateDraft = (
    field: "keywordsText" | "excludedKeywordsText" | "discoveryRadiusKmText" | "discoveryIntervalHoursText",
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const toggleAutoDiscovery = () => {
    setDraft((current) => ({ ...current, autoDiscoveryEnabled: !current.autoDiscoveryEnabled }));
    setSaved(false);
  };

  const toggleDraftValue = (
    field: "employmentTypes" | "workModes",
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: toggleSettingsValue(current[field], value),
    }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updatedLoop = await onSave(mapLoopSettingsDraftToPatch(draft));
      if (updatedLoop) {
        savedLoopIdRef.current = updatedLoop.id;
        setDraft(createLoopSettingsDraft(updatedLoop));
      }
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("loops.settingsSaveError", "Не удалось сохранить настройки."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-1 text-card-foreground">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t("loops.settingsTitle", "Настройки направления")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "loops.settingsDescription",
            "Настройте направление поиска и расписание автоматической синхронизации.",
          )}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          {textareaFields.map((field) => (
            <label className="block" key={field.key}>
              <span className="text-sm font-medium text-foreground">
                {t(field.labelKey, field.fallback)}
              </span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
                value={draft[field.key]}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                disabled={isSaving}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                {t(field.hintKey, field.hintFallback)}
              </span>
            </label>
          ))}

          <CheckboxGroup
            label={t("loops.settingsEmploymentTypes", "Тип занятости")}
            options={mergeKnownAndSelectedOptions(
              EMPLOYMENT_TYPE_OPTIONS,
              draft.employmentTypes,
            )}
            selectedValues={draft.employmentTypes}
            disabled={isSaving}
            onToggle={(value) => toggleDraftValue("employmentTypes", value)}
          />

          <CheckboxGroup
            label={t("loops.settingsWorkModes", "Формат работы")}
            options={mergeKnownAndSelectedOptions(WORK_MODE_OPTIONS, draft.workModes)}
            selectedValues={draft.workModes}
            disabled={isSaving}
            onToggle={(value) => toggleDraftValue("workModes", value)}
          />

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              {t("loops.settingsDiscoveryRadiusKm", "Радиус поиска, км")}
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
              min="0"
              max="250"
              step="1"
              type="number"
              value={draft.discoveryRadiusKmText}
              onChange={(event) =>
                updateDraft("discoveryRadiusKmText", event.target.value)
              }
              disabled={isSaving}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {t(
                "loops.settingsDiscoveryRadiusHint",
                "Оставьте пустым, чтобы использовать значение backend по умолчанию.",
              )}
            </span>
          </label>
        </div>

        {/* ── Auto-discovery ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t("loops.settingsAutoDiscovery", "Автоматический поиск")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(
                  "loops.settingsAutoDiscoveryHint",
                  "Планировщик будет запускать поиск автоматически по расписанию.",
                )}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.autoDiscoveryEnabled}
              disabled={isSaving}
              onClick={toggleAutoDiscovery}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                draft.autoDiscoveryEnabled ? "bg-sky-600" : "bg-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                  draft.autoDiscoveryEnabled ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>

          {draft.autoDiscoveryEnabled ? (
            <label className="mt-4 block">
              <span className="text-xs font-medium text-muted-foreground">
                {t("loops.settingsIntervalHours", "Интервал, часов (1–168)")}
              </span>
              <input
                type="number"
                min="1"
                max="168"
                step="1"
                className="mt-1.5 w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
                value={draft.discoveryIntervalHoursText}
                onChange={(e) => updateDraft("discoveryIntervalHoursText", e.target.value)}
                disabled={isSaving}
              />
            </label>
          ) : null}
        </div>

        <SaveStatusSection
          error={error}
          saved={saved}
          isSaving={isSaving}
          t={t}
        />
      </form>

      {(onPauseResume ?? onArchive) ? (
        <div className="mt-6 rounded-[12px] border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-[13px] font-semibold text-destructive">
            {t("loops.dangerZone", "Danger zone")}
          </h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {t("loops.dangerZoneHint", "Irreversible or disruptive actions for this loop.")}
          </p>
          {dangerError ? (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {dangerError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {onPauseResume ? (
              <button
                type="button"
                disabled={isDangerBusy}
                onClick={async () => {
                  setIsDangerBusy(true);
                  setDangerError(null);
                  try { await onPauseResume(); } catch (e) {
                    setDangerError(e instanceof Error ? e.message : "Error");
                  } finally { setIsDangerBusy(false); }
                }}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isPaused
                  ? t("loops.resume", "Resume loop")
                  : t("loops.pause", "Pause loop")}
              </button>
            ) : null}
            {onArchive ? (
              <button
                type="button"
                disabled={isDangerBusy}
                onClick={async () => {
                  if (!window.confirm(t("loops.archiveConfirm", "Archive this loop? It will be hidden from the active list."))) return;
                  setIsDangerBusy(true);
                  setDangerError(null);
                  try { await onArchive(); } catch (e) {
                    setDangerError(e instanceof Error ? e.message : "Error");
                  } finally { setIsDangerBusy(false); }
                }}
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                {t("loops.archive", "Archive loop")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CheckboxGroup({
  label,
  options,
  selectedValues,
  disabled,
  onToggle,
  hint,
  getOptionMeta,
}: {
  label: string;
  options: readonly LoopSettingsOption[];
  selectedValues: readonly string[];
  disabled: boolean;
  onToggle: (value: string) => void;
  hint?: string;
  getOptionMeta?: (value: string) => string | null;
}) {
  const selected = new Set(selectedValues);

  return (
    <fieldset className="block">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.has(option.value);
          const meta = getOptionMeta?.(option.value);

          return (
            <label
              key={option.value}
              className={[
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                checked
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.value)}
              />
              <span className="flex min-w-0 flex-col leading-tight">
                <span>{option.label}</span>
                {meta ? (
                  <span className="mt-0.5 text-[10.5px] text-muted-foreground">
                    {meta}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
