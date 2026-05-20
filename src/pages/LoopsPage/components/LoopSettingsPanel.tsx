import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import {
  getDiscoverySourceRuntimeStatusViaRest,
  type DiscoverySourceRuntimeStatus,
} from "src/features/discoveryRuns";
import type { UpdateBackendLoopInput } from "src/features/loops";

import {
  DISCOVERY_SOURCE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  createLoopSettingsDraft,
  getLoopSettingsSourceStatusLabel,
  mapLoopSettingsDraftToPatch,
  mergeKnownAndSelectedOptions,
  toggleSettingsValue,
  type LoopSettingsDraft,
  type LoopSettingsOption,
} from "./loopSettingsPanel.helpers";

interface LoopSettingsPanelProps {
  loop: Loop;
  onSave: (patch: UpdateBackendLoopInput) => Promise<Loop | void>;
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

export function LoopSettingsPanel({ loop, onSave }: LoopSettingsPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<LoopSettingsDraft>(() =>
    createLoopSettingsDraft(loop),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sourceRuntimeStatuses, setSourceRuntimeStatuses] = useState<
    DiscoverySourceRuntimeStatus[] | null
  >(null);
  const savedLoopIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSourceStatuses() {
      try {
        const response = await getDiscoverySourceRuntimeStatusViaRest();
        if (!cancelled) setSourceRuntimeStatuses(response.items);
      } catch {
        if (!cancelled) setSourceRuntimeStatuses(null);
      }
    }

    void loadSourceStatuses();

    return () => {
      cancelled = true;
    };
  }, []);

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
    field: "keywordsText" | "excludedKeywordsText" | "discoveryRadiusKmText",
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const toggleDraftValue = (
    field: "employmentTypes" | "workModes" | "selectedSources",
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
            "Настройте направление поиска. Эти параметры сохраняются в backend, но автоматический поиск пока не запускают.",
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

          <div className="md:col-span-2">
            <CheckboxGroup
              label={t("loops.settingsSelectedSources", "Источники")}
              options={mergeKnownAndSelectedOptions(
                DISCOVERY_SOURCE_OPTIONS,
                draft.selectedSources,
              )}
              selectedValues={draft.selectedSources}
              disabled={isSaving}
              onToggle={(value) => toggleDraftValue("selectedSources", value)}
              getOptionMeta={(value) =>
                getLoopSettingsSourceStatusLabel(value, sourceRuntimeStatuses)
              }
              hint={t(
                "loops.settingsSourcesHint",
                "Сохраняются технические source id, но здесь показаны понятные названия.",
              )}
            />
          </div>

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
      </form>
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
