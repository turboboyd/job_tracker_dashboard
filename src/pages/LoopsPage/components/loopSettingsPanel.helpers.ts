import type { Loop } from "src/entities/loop";
import type { DiscoverySourceRuntimeStatus } from "src/features/discoveryRuns";
import type { UpdateBackendLoopInput } from "src/features/loops";

type LoopSettingsSource = Pick<
  Loop,
  | "keywords"
  | "excludedKeywords"
  | "employmentTypes"
  | "workModes"
  | "selectedSources"
  | "discoveryRadiusKm"
>;

export interface LoopSettingsDraft {
  keywordsText: string;
  excludedKeywordsText: string;
  employmentTypes: string[];
  workModes: string[];
  selectedSources: string[];
  discoveryRadiusKmText: string;
}

export interface LoopSettingsOption {
  value: string;
  label: string;
}

export const DISCOVERY_SOURCE_OPTIONS: readonly LoopSettingsOption[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "stepstone", label: "StepStone" },
  { value: "xing", label: "XING" },
  { value: "arbeitsagentur", label: "Jobbörse Arbeitsagentur" },
  { value: "adzuna", label: "Adzuna" },
  { value: "remotive", label: "Remotive" },
  { value: "greenhouse", label: "Greenhouse company boards" },
  { value: "lever", label: "Lever company boards" },
  { value: "manual_url", label: "Вручную по ссылке" },
  { value: "company_websites", label: "Сайты компаний" },
];

export const EMPLOYMENT_TYPE_OPTIONS: readonly LoopSettingsOption[] = [
  { value: "full_time", label: "Полная занятость" },
  { value: "part_time", label: "Частичная занятость" },
  { value: "internship", label: "Практика" },
  { value: "apprenticeship", label: "Ausbildung" },
  { value: "ausbildung", label: "Ausbildung" },
  { value: "contract", label: "Контракт" },
  { value: "any", label: "Любой формат" },
];

export const WORK_MODE_OPTIONS: readonly LoopSettingsOption[] = [
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
  { value: "onsite", label: "В офисе" },
  { value: "remote_only", label: "Только удалённо" },
  { value: "any", label: "Любой формат" },
];

export const formatSettingsList = (values?: readonly string[]): string => {
  return values?.join("\n") ?? "";
};

export const normalizeSettingsListText = (value: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLocaleLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      result.push(item);
    });

  return result;
};

export const createLoopSettingsDraft = (
  loop: LoopSettingsSource,
): LoopSettingsDraft => ({
  keywordsText: formatSettingsList(loop.keywords),
  excludedKeywordsText: formatSettingsList(loop.excludedKeywords),
  employmentTypes: normalizeSettingsValues(loop.employmentTypes),
  workModes: normalizeSettingsValues(loop.workModes),
  selectedSources: normalizeSettingsValues(loop.selectedSources),
  discoveryRadiusKmText:
    loop.discoveryRadiusKm == null ? "" : String(loop.discoveryRadiusKm),
});

export const mapLoopSettingsDraftToPatch = (
  draft: LoopSettingsDraft,
): UpdateBackendLoopInput => {
  const patch: UpdateBackendLoopInput = {
    keywords: normalizeSettingsListText(draft.keywordsText),
    excludedKeywords: normalizeSettingsListText(draft.excludedKeywordsText),
    employmentTypes: normalizeSettingsValues(draft.employmentTypes),
    workModes: normalizeSettingsValues(draft.workModes),
    selectedSources: normalizeSettingsValues(draft.selectedSources),
  };

  const radiusText = draft.discoveryRadiusKmText.trim();

  if (radiusText !== "") {
    patch.discoveryRadiusKm = Number(radiusText);
  }

  return patch;
};

export function normalizeSettingsValues(values?: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function getLoopSettingsOptionLabel(
  value: string,
  options: readonly LoopSettingsOption[],
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getLoopSettingsSourceStatusLabel(
  value: string,
  statuses?: readonly DiscoverySourceRuntimeStatus[] | null,
): string | null {
  const status = statuses?.find((item) => item.sourceId === value);

  if (status) {
    if (status.runnable) return "Готов к preview";
    if (status.configurationStatus === "not_configured") return "Нужна настройка сервера";
    if (status.configurationStatus === "not_runnable") return "Только ручной/будущий источник";
  }

  if (value === "arbeitsagentur" || value === "remotive") {
    return statuses ? "Готов к preview" : "Статус проверяется";
  }

  if (value === "adzuna" || value === "greenhouse" || value === "lever") {
    return statuses ? "Нужна настройка сервера" : "Статус проверяется";
  }

  if (value === "manual_url") return "Ручное добавление";
  if (value === "stepstone" || value === "indeed" || value === "linkedin" || value === "xing") {
    return "Preview пока не подключён";
  }
  if (value === "company_websites") return "Широкий поиск пока не подключён";

  return null;
}

export function mergeKnownAndSelectedOptions(
  options: readonly LoopSettingsOption[],
  selectedValues: readonly string[],
): LoopSettingsOption[] {
  const known = new Set(options.map((option) => option.value));
  const unknownSelected = selectedValues
    .filter((value) => !known.has(value))
    .map((value) => ({ value, label: value }));

  return [...options, ...unknownSelected];
}

export function toggleSettingsValue(
  values: readonly string[],
  value: string,
): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
