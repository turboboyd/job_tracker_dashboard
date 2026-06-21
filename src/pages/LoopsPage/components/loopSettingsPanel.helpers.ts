import {
  DISCOVERY_SOURCE_PRIORITY,
  getDiscoverySourcePriority,
  type Loop,
} from "src/entities/loop";
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
  | "autoDiscoveryEnabled"
  | "discoveryIntervalHours"
>;

export interface LoopSettingsDraft {
  keywordsText: string;
  excludedKeywordsText: string;
  employmentTypes: string[];
  workModes: string[];
  selectedSources: string[];
  discoveryRadiusKmText: string;
  autoDiscoveryEnabled: boolean;
  discoveryIntervalHoursText: string;
}

export interface LoopSettingsOption {
  value: string;
  label: string;
}

const DISCOVERY_SOURCE_LABELS: Record<string, string> = {
  arbeitsagentur: "Jobbörse Arbeitsagentur",
  indeed: "Indeed",
  stepstone: "StepStone",
  xing: "XING",
  adzuna: "Adzuna",
  remotive: "Remotive",
  arbeitnow: "Arbeit Now",
  remotejobs: "Remote Jobs",
  himalayas: "Himalayas",
  remoteok: "RemoteOK",
  greenhouse: "Greenhouse company boards",
  lever: "Lever company boards",
  linkedin: "LinkedIn",
  manual_url: "Вручную по ссылке",
  company_websites: "Сайты компаний",
};

// Ordered by the product source priority (DISCOVERY_SOURCE_PRIORITY in
// entities/loop): legal/easier job boards first, LinkedIn after all board/API
// sources. Drives the Sources tab, the settings panel and, via
// sortSourcesByPriority, the Overview source rail.
export const DISCOVERY_SOURCE_OPTIONS: readonly LoopSettingsOption[] =
  DISCOVERY_SOURCE_PRIORITY.map((value) => ({
    value,
    label: DISCOVERY_SOURCE_LABELS[value] ?? value,
  }));

/** Order source ids by the product priority; unknown sources keep their
 * relative order after all known ones. Case-insensitive, non-mutating. */
export function sortSourcesByPriority(sources: readonly string[]): string[] {
  return [...sources].sort(
    (a, b) => getDiscoverySourcePriority(a) - getDiscoverySourcePriority(b),
  );
}

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
  autoDiscoveryEnabled: loop.autoDiscoveryEnabled ?? false,
  discoveryIntervalHoursText: String(loop.discoveryIntervalHours ?? 4),
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
    autoDiscoveryEnabled: draft.autoDiscoveryEnabled,
  };

  const radiusText = draft.discoveryRadiusKmText.trim();
  if (radiusText !== "") {
    patch.discoveryRadiusKm = Number(radiusText);
  }

  if (draft.autoDiscoveryEnabled) {
    const hours = parseInt(draft.discoveryIntervalHoursText, 10);
    if (Number.isFinite(hours) && hours >= 1 && hours <= 168) {
      patch.discoveryIntervalHours = hours;
    }
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

const SOURCE_READY_LABEL = "Готов к preview";
const SOURCE_STATUS_PENDING_LABEL = "Статус проверяется";
const SOURCE_NOT_CONFIGURED_LABEL = "Нужна настройка сервера";
const SOURCE_NOT_RUNNABLE_LABEL = "Только ручной/будущий источник";

const READY_FALLBACK_SOURCES = new Set([
  "arbeitsagentur",
  "remotive",
  "arbeitnow",
  "remotejobs",
  "himalayas",
  "remoteok",
]);

const CONFIGURATION_FALLBACK_SOURCES = new Set([
  "adzuna",
  "greenhouse",
  "lever",
]);

const STATIC_SOURCE_STATUS_LABELS: Readonly<Record<string, string>> = {
  manual_url: "Ручное добавление",
  stepstone: "Preview пока не подключён",
  indeed: "Preview пока не подключён",
  linkedin: "Preview пока не подключён",
  xing: "Preview пока не подключён",
  company_websites: "Широкий поиск пока не подключён",
};

function getRuntimeSourceStatusLabel(
  status?: DiscoverySourceRuntimeStatus,
): string | null {
  if (status?.runnable) return SOURCE_READY_LABEL;
  if (status?.configurationStatus === "not_configured") {
    return SOURCE_NOT_CONFIGURED_LABEL;
  }
  if (status?.configurationStatus === "not_runnable") {
    return SOURCE_NOT_RUNNABLE_LABEL;
  }
  return null;
}

function getFallbackSourceStatusLabel(
  value: string,
  statuses?: readonly DiscoverySourceRuntimeStatus[] | null,
): string | null {
  if (READY_FALLBACK_SOURCES.has(value)) {
    return statuses ? SOURCE_READY_LABEL : SOURCE_STATUS_PENDING_LABEL;
  }
  if (CONFIGURATION_FALLBACK_SOURCES.has(value)) {
    return statuses
      ? SOURCE_NOT_CONFIGURED_LABEL
      : SOURCE_STATUS_PENDING_LABEL;
  }
  return STATIC_SOURCE_STATUS_LABELS[value] ?? null;
}

export function getLoopSettingsSourceStatusLabel(
  value: string,
  statuses?: readonly DiscoverySourceRuntimeStatus[] | null,
): string | null {
  const status = statuses?.find((item) => item.sourceId === value);
  return (
    getRuntimeSourceStatusLabel(status) ??
    getFallbackSourceStatusLabel(value, statuses)
  );
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
