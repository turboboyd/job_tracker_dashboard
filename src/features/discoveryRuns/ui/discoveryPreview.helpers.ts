import { ApiError } from "src/shared/api/rest/restClient";

import type { DiscoveryRunResponse } from "../rest/types";

export const ARBEITSAGENTUR_SOURCE_ID = "arbeitsagentur" as const;

export const DISCOVERY_PREVIEW_COPY = {
  title: "Поиск в Arbeitsagentur",
  intro: "Предварительный поиск. Вакансии не сохраняются автоматически.",
  supportedOnly: "Сейчас поддерживается только Arbeitsagentur.",
  openAndAddManually: "Вы можете открыть вакансию и добавить её вручную.",
  futureSave: "Автоматическое сохранение будет отдельным этапом.",
  manualSaveBoundary:
    "Заявка не создаётся автоматически. После сохранения вакансия появится в найденных вакансиях.",
  runButton: "Проверить вакансии",
  loading: "Проверяем вакансии в Arbeitsagentur...",
  empty:
    "Вакансии не найдены. Попробуйте уточнить профессию, ключевые слова или город в настройках направления.",
  hintNotSelected:
    "Добавьте Arbeitsagentur в источники направления, чтобы использовать предварительный поиск.",
  openVacancy: "Открыть вакансию",
  saveAsMatch: "Сохранить как совпадение",
  savingAsMatch: "Сохраняем...",
  savedAsMatch: "Сохранено",
  alreadySaved: "Уже сохранено",
  previewBadge: "Не сохранено",
} as const;

export type DiscoveryPreviewSaveState = "idle" | "saving" | "saved" | "duplicate";

const WARNING_MESSAGES: Record<string, string> = {
  automatic_discovery_not_available: "Этот источник пока не поддерживает предварительный поиск.",
  automatic_match_persistence_not_enabled: "Автоматическое сохранение пока не включено.",
  source_not_found: "Источник не найден в реестре.",
  source_disabled: "Источник сейчас выключен.",
  no_sources_selected: "Выберите источник Arbeitsagentur в настройках направления.",
  no_selected_sources: "Выберите источник Arbeitsagentur в настройках направления.",
  arbeitsagentur_requires_search_terms:
    "Добавьте профессию или ключевые слова в настройки направления.",
  arbeitsagentur_timeout: "Источник временно недоступен. Попробуйте позже.",
  arbeitsagentur_api_unavailable: "Источник временно недоступен. Попробуйте позже.",
  arbeitsagentur_invalid_response: "Источник вернул неожиданный ответ. Попробуйте позже.",
  source_adapter_failed: "Источник временно недоступен. Попробуйте позже.",
};

export function isArbeitsagenturSelected(selectedSources: readonly string[] | undefined): boolean {
  return Boolean(selectedSources?.includes(ARBEITSAGENTUR_SOURCE_ID));
}

export function getDiscoveryWarningMessage(code: string): string {
  return WARNING_MESSAGES[code] ?? code;
}

export function getDiscoveryPreviewErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      WARNING_MESSAGES[error.code] ??
      "Не удалось выполнить предварительный поиск. Попробуйте ещё раз."
    );
  }
  return "Не удалось выполнить предварительный поиск. Попробуйте ещё раз.";
}

export function getDiscoveryPreviewSaveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = WARNING_MESSAGES[error.code];
    if (message) return message;
    if (error.status === 422) return "Не удалось сохранить вакансию. Проверьте ссылку и источник.";
    if (error.status === 404) return "Направление поиска не найдено.";
  }
  return "Не удалось сохранить вакансию. Попробуйте ещё раз.";
}

export function getDiscoveryPreviewSaveButtonLabel(
  saveState: DiscoveryPreviewSaveState,
): string {
  if (saveState === "saving") return DISCOVERY_PREVIEW_COPY.savingAsMatch;
  if (saveState === "duplicate") return DISCOVERY_PREVIEW_COPY.alreadySaved;
  if (saveState === "saved") return DISCOVERY_PREVIEW_COPY.savedAsMatch;
  return DISCOVERY_PREVIEW_COPY.saveAsMatch;
}

export function isDiscoveryPreviewSaveDisabled(
  saveState: DiscoveryPreviewSaveState,
): boolean {
  return saveState === "saving" || saveState === "saved" || saveState === "duplicate";
}

export function collectDiscoveryPreviewMessages(result: DiscoveryRunResponse | null): string[] {
  if (!result) return [];
  const codes = [
    ...result.warnings.map((warning) => warning.split(":").at(-1) ?? warning),
    ...result.items.flatMap((item) => [item.reason, ...item.warnings, ...item.errors]),
  ];
  return [...new Set(codes.filter(Boolean).map(getDiscoveryWarningMessage))];
}

export function getDiscoveryPreviewCopyText(): string {
  return Object.values(DISCOVERY_PREVIEW_COPY).join(" ");
}
