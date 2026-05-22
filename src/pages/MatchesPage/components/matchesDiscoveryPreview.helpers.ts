import type { Loop } from "src/entities/loop";
import type {
  DiscoveryRunPreviewItem,
  DiscoveryRunResponse,
  DiscoverySearchScope,
  DiscoverySourceRuntimeStatus,
} from "src/features/discoveryRuns";

export const RUNNABLE_DISCOVERY_SOURCE_IDS = [
  "arbeitsagentur",
  "arbeitnow",
  "adzuna",
  "remotive",
  "remotejobs",
  "himalayas",
  "remoteok",
  "greenhouse",
  "lever",
] as const;

export type RunnableDiscoverySourceId = (typeof RUNNABLE_DISCOVERY_SOURCE_IDS)[number];

export const RUNNABLE_DISCOVERY_SOURCE_LABELS: Record<
  RunnableDiscoverySourceId,
  string
> = {
  arbeitsagentur: "Arbeitsagentur",
  arbeitnow: "Arbeitnow",
  adzuna: "Adzuna",
  remotive: "Remotive",
  remotejobs: "RemoteJobs.org",
  himalayas: "Himalayas",
  remoteok: "Remote OK",
  greenhouse: "Greenhouse",
  lever: "Lever",
};

const RUNNABLE_DISCOVERY_SOURCE_SET = new Set<string>(RUNNABLE_DISCOVERY_SOURCE_IDS);
const NO_KEY_DISCOVERY_SOURCE_SET = new Set<RunnableDiscoverySourceId>([
  "arbeitsagentur",
  "arbeitnow",
  "remotive",
  "remotejobs",
  "himalayas",
  "remoteok",
]);
export const MATCHES_DISCOVERY_PAGE_SIZE = 5;

export const MATCHES_DISCOVERY_COPY = {
  title: "Поиск вакансий",
  intro:
    "Вакансии подтягиваются из безопасно подключённых источников при открытии страницы и при смене фильтра направлений. Они не сохраняются автоматически.",
  supportedOnly:
    "Сейчас подключены Arbeitsagentur, Arbeitnow, Adzuna, Remotive, RemoteJobs.org, Himalayas, Remote OK, Greenhouse и Lever. Источники с ключами или списками компаний могут вернуть подсказку настройки.",
  noAutoApplication: "Заявка не создаётся автоматически.",
  saveBoundary:
    "Выберите подходящую вакансию и добавьте её в Мои заявки.",
  loopLabel: "Направление поиска",
  allLoops: "Все направления",
  sourceLabel: "Источник",
  allSources: "Все источники",
  searchScopeLabel: "Ширина поиска",
  focusedScope: "Точный",
  normalScope: "Обычный",
  broadScope: "Шире",
  runButton: "Обновить вакансии",
  retrySource: "Обновить источник",
  refreshSource: "Обновить",
  searchBroaderSource: "Искать шире",
  refreshSourceUnavailable: "Источник не выбран в текущем фильтре направления.",
  loadMore: "Показать ещё 5",
  loadingMore: "Загружаем ещё...",
  noMoreForSource: "Больше вакансий от этого источника пока нет.",
  loading: "Ищем вакансии...",
  lastUpdatedPrefix: "Обновлено",
  notUpdatedYet: "Ещё не обновлялось",
  hiddenDuplicatesPrefix: "Скрыто дублей",
  hideSavedToggle: "Скрыть сохранённые",
  hiddenSavedPrefix: "Скрыто сохранённых",
  notInterested: "Не интересно",
  restorePreviewItem: "Вернуть в preview",
  hiddenByUserPrefix: "Скрыто вручную",
  allPreviewItemsHiddenByUser:
    "Все найденные вакансии скрыты вручную в текущей сессии просмотра.",
  showHiddenPreviewItems: "Показать скрытые",
  allPreviewItemsHiddenAsSaved:
    "Все найденные вакансии уже сохранены и скрыты фильтром сохранённых.",
  showSavedPreviewItems: "Показать сохранённые",
  empty:
    "Новых вакансий для предварительного просмотра не найдено. Проверьте профессию, ключевые слова или город в настройках направления.",
  noEligibleLoops:
    "Добавьте хотя бы одно активное направление поиска, чтобы обновлять вакансии здесь.",
  sourceEmpty:
    "Источник не вернул вакансии для текущего направления. Попробуйте более широкие ключевые слова или обновите источник ещё раз.",
  sourceEmptyReady:
    "Источник готов, но по текущим словам ничего не нашёл. Попробуйте режим «Шире», упростите профессию или добавьте город.",
  sourceNeedsSetup:
    "Источник подключён, но требует серверной настройки перед поиском вакансий.",
  sourceUnavailable:
    "Источник временно недоступен. Попробуйте обновить его позже.",
  sourceLastMessagePrefix: "Последнее сообщение",
  sourceHiddenSavedOnly:
    "Все найденные вакансии из этого источника уже сохранены. Отключите фильтр сохранённых, чтобы посмотреть их.",
  previewCountPrefix: "Найдено для предварительного просмотра",
  notSaved: "Не сохранено",
  openVacancy: "Открыть вакансию",
  saveAsMatch: "Добавить в заявки",
  saving: "Сохраняем...",
  saved: "Сохранено",
  duplicate: "Уже сохранено",
  companyMissing: "Компания не указана",
  titleMissing: "Вакансия без названия",
  refreshAfterSave:
    "После добавления вакансия появится в разделе Мои заявки со статусом Saved.",
} as const;

export const MATCHES_DISCOVERY_SEARCH_SCOPE_OPTIONS: ReadonlyArray<{
  id: DiscoverySearchScope;
  label: string;
}> = [
  { id: "broad", label: MATCHES_DISCOVERY_COPY.broadScope },
  { id: "normal", label: MATCHES_DISCOVERY_COPY.normalScope },
  { id: "focused", label: MATCHES_DISCOVERY_COPY.focusedScope },
];

export type MatchesDiscoverySaveState = "idle" | "saving" | "saved" | "duplicate";

export interface MatchesDiscoveryLoopOption {
  id: string;
  name: string;
  sourceIds: RunnableDiscoverySourceId[];
}

export interface MatchesDiscoverySourceStatusItem {
  sourceId: RunnableDiscoverySourceId;
  label: string;
  statusLabel: string;
  state: "ready" | "needs_setup" | "unavailable";
  description: string;
}

export interface MatchesDiscoverySourceStatusSummary {
  ready: number;
  needsSetup: number;
  unavailable: number;
  total: number;
  label: string;
}

export interface MatchesDiscoveryDiagnosticsGroup {
  title: string;
  description: string;
  items: MatchesDiscoverySourceStatusItem[];
}

export interface MatchesDiscoverySourceFilterOption {
  id: "all" | RunnableDiscoverySourceId;
  label: string;
  count: number;
}

export interface MatchesDiscoveryPreviewDedupeInput {
  sourceId: string;
  externalId?: string | null;
  sourceUrl: string;
}

export function getMatchesDiscoverySourceStatusItems(
  runtimeStatuses?: readonly DiscoverySourceRuntimeStatus[],
): MatchesDiscoverySourceStatusItem[] {
  const runtimeBySource = new Map(
    (runtimeStatuses ?? []).map((status) => [status.sourceId, status] as const),
  );

  return [
    {
      sourceId: "arbeitsagentur",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.arbeitsagentur,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("arbeitsagentur"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("arbeitsagentur"), "ready"),
      description: "Публичный источник, работает без дополнительных ключей.",
    },
    {
      sourceId: "arbeitnow",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.arbeitnow,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("arbeitnow"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("arbeitnow"), "ready"),
      description: "Публичный Europe/remote источник, работает без дополнительных ключей.",
    },
    {
      sourceId: "remotive",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.remotive,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("remotive"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("remotive"), "ready"),
      description: "Публичный remote-источник, работает без дополнительных ключей.",
    },
    {
      sourceId: "remotejobs",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.remotejobs,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("remotejobs"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("remotejobs"), "ready"),
      description: "Публичный remote-источник, работает без дополнительных ключей.",
    },
    {
      sourceId: "himalayas",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.himalayas,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("himalayas"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("himalayas"), "ready"),
      description: "Публичный remote-источник Himalayas, работает без дополнительных ключей.",
    },
    {
      sourceId: "remoteok",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.remoteok,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("remoteok"), "Готов"),
      state: getRuntimeStatusState(runtimeBySource.get("remoteok"), "ready"),
      description: "Публичный remote-источник Remote OK, работает без дополнительных ключей.",
    },
    {
      sourceId: "adzuna",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.adzuna,
      statusLabel: getRuntimeStatusLabel(runtimeBySource.get("adzuna"), "Нужны ключи"),
      state: getRuntimeStatusState(runtimeBySource.get("adzuna"), "needs_setup"),
      description:
        "Работает после настройки ADZUNA_APP_ID и ADZUNA_APP_KEY на сервере.",
    },
    {
      sourceId: "greenhouse",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.greenhouse,
      statusLabel: getRuntimeStatusLabel(
        runtimeBySource.get("greenhouse"),
        "Нужен список компаний",
      ),
      state: getRuntimeStatusState(runtimeBySource.get("greenhouse"), "needs_setup"),
      description: "Работает по GREENHOUSE_BOARD_TOKENS, заданным на сервере.",
    },
    {
      sourceId: "lever",
      label: RUNNABLE_DISCOVERY_SOURCE_LABELS.lever,
      statusLabel: getRuntimeStatusLabel(
        runtimeBySource.get("lever"),
        "Нужен список компаний",
      ),
      state: getRuntimeStatusState(runtimeBySource.get("lever"), "needs_setup"),
      description: "Работает по LEVER_SITE_NAMES, заданным на сервере.",
    },
  ];
}

export function getMatchesDiscoverySourceStatusSummary(
  items: readonly MatchesDiscoverySourceStatusItem[],
): MatchesDiscoverySourceStatusSummary {
  const ready = items.filter((item) => item.state === "ready").length;
  const needsSetup = items.filter((item) => item.state === "needs_setup").length;
  const unavailable = items.filter((item) => item.state === "unavailable").length;

  return {
    ready,
    needsSetup,
    unavailable,
    total: items.length,
    label: `Готово источников: ${ready}/${items.length}. Нужна настройка: ${needsSetup}.`,
  };
}

export function formatMatchesDiscoverySetupSummary(
  items: readonly MatchesDiscoverySourceStatusItem[],
): string {
  const noKeyReady = items.filter(
    (item) => NO_KEY_DISCOVERY_SOURCE_SET.has(item.sourceId) && item.state === "ready",
  ).length;
  const needsSetup = items.filter((item) => item.state === "needs_setup").length;
  const unavailable = items.filter((item) => item.state === "unavailable").length;
  const unavailableSuffix =
    unavailable > 0 ? ` Временно недоступны: ${unavailable}.` : "";

  return `Без ключей готовы: ${noKeyReady}. Требуют настройки: ${needsSetup}.${unavailableSuffix}`;
}

export function getMatchesDiscoveryEmptySourceMessage(
  source: MatchesDiscoverySourceStatusItem | undefined,
  runtimeMessage?: string,
): string {
  if (runtimeMessage) return runtimeMessage;
  if (!source) return MATCHES_DISCOVERY_COPY.sourceEmpty;
  if (source.state === "needs_setup") return MATCHES_DISCOVERY_COPY.sourceNeedsSetup;
  if (source.state === "unavailable") return MATCHES_DISCOVERY_COPY.sourceUnavailable;
  return MATCHES_DISCOVERY_COPY.sourceEmptyReady;
}

export function getMatchesDiscoveryDiagnosticsGroups(
  items: readonly MatchesDiscoverySourceStatusItem[],
): MatchesDiscoveryDiagnosticsGroup[] {
  const noKeyReady = items.filter(
    (item) => NO_KEY_DISCOVERY_SOURCE_SET.has(item.sourceId) && item.state === "ready",
  );
  const needsSetup = items.filter((item) => item.state === "needs_setup");
  const unavailable = items.filter((item) => item.state === "unavailable");

  return [
    {
      title: `Готовы без ключей (${noKeyReady.length})`,
      description: "Можно запускать сразу. Если результатов мало, расширьте режим поиска.",
      items: noKeyReady,
    },
    {
      title: `Требуют настройки (${needsSetup.length})`,
      description: "Добавьте серверные ключи или списки компаний, чтобы включить эти источники.",
      items: needsSetup,
    },
    {
      title: `Временно недоступны (${unavailable.length})`,
      description: "Источник подключён, но сейчас не готов к запросу. Попробуйте позже.",
      items: unavailable,
    },
  ].filter((group) => group.items.length > 0);
}

function getRuntimeStatusLabel(
  status: DiscoverySourceRuntimeStatus | undefined,
  fallback: string,
): string {
  if (!status) return fallback;
  if (status.runnable) return "Готов";
  if (status.configurationStatus === "not_configured") return "Нужна настройка";
  if (status.configurationStatus === "not_runnable") return "Не подключён";
  return fallback;
}

function getRuntimeStatusState(
  status: DiscoverySourceRuntimeStatus | undefined,
  fallback: MatchesDiscoverySourceStatusItem["state"],
): MatchesDiscoverySourceStatusItem["state"] {
  if (!status) return fallback;
  if (status.runnable) return "ready";
  if (status.configurationStatus === "not_configured") return "needs_setup";
  return "unavailable";
}

export function getRunnableDiscoverySourceIds(
  selectedSources?: readonly string[],
): RunnableDiscoverySourceId[] {
  return (selectedSources ?? []).filter(
    (sourceId): sourceId is RunnableDiscoverySourceId =>
      RUNNABLE_DISCOVERY_SOURCE_SET.has(sourceId),
  );
}

export function getDefaultMatchesDiscoverySourceIds(): RunnableDiscoverySourceId[] {
  return [...RUNNABLE_DISCOVERY_SOURCE_IDS];
}

export function getRunnableDiscoverySourceLabel(sourceId: string | null): string {
  if (sourceId && sourceId in RUNNABLE_DISCOVERY_SOURCE_LABELS) {
    return RUNNABLE_DISCOVERY_SOURCE_LABELS[sourceId as RunnableDiscoverySourceId];
  }
  return sourceId || "Источник";
}

export function getMatchesDiscoverySourceFilterOptions(
  sourceIds: readonly string[],
  knownSourceIds: readonly string[] = [],
): MatchesDiscoverySourceFilterOption[] {
  const counts = new Map<RunnableDiscoverySourceId, number>();
  const known = new Set<RunnableDiscoverySourceId>();

  for (const sourceId of sourceIds) {
    if (!RUNNABLE_DISCOVERY_SOURCE_SET.has(sourceId)) continue;
    const runnableSourceId = sourceId as RunnableDiscoverySourceId;
    counts.set(runnableSourceId, (counts.get(runnableSourceId) ?? 0) + 1);
  }
  for (const sourceId of knownSourceIds) {
    if (!RUNNABLE_DISCOVERY_SOURCE_SET.has(sourceId)) continue;
    known.add(sourceId as RunnableDiscoverySourceId);
  }

  return [
    {
      id: "all",
      label: MATCHES_DISCOVERY_COPY.allSources,
      count: sourceIds.length,
    },
    ...RUNNABLE_DISCOVERY_SOURCE_IDS.filter(
      (sourceId) => counts.has(sourceId) || known.has(sourceId),
    ).map((sourceId) => ({
        id: sourceId,
        label: RUNNABLE_DISCOVERY_SOURCE_LABELS[sourceId],
        count: counts.get(sourceId) ?? 0,
      })),
  ];
}

export function getMatchesDiscoveryLoopOptions(
  loops: readonly Loop[],
): MatchesDiscoveryLoopOption[] {
  return loops
    .filter((loop) => loop.status !== "archived")
    .map((loop) => ({
      id: loop.id,
      name: loop.name || loop.title || loop.id,
      sourceIds: getDefaultMatchesDiscoverySourceIds(),
    }))
    .filter((loop) => loop.sourceIds.length > 0);
}

export function getPreferredMatchesDiscoveryLoopId(
  options: readonly MatchesDiscoveryLoopOption[],
  selectedLoopIds: readonly string[],
): string {
  const selected = selectedLoopIds.find((id) =>
    options.some((option) => option.id === id),
  );
  return selected ?? options[0]?.id ?? "";
}

export function getMatchesDiscoveryTargetLoopIds(
  options: readonly MatchesDiscoveryLoopOption[],
  selectedLoopId: string,
  filteredLoopIds: readonly string[],
): string[] {
  if (selectedLoopId && selectedLoopId !== "all") {
    return options.some((option) => option.id === selectedLoopId) ? [selectedLoopId] : [];
  }

  const filtered = filteredLoopIds.filter((id) =>
    options.some((option) => option.id === id),
  );
  return filtered.length > 0 ? filtered : options.map((option) => option.id);
}

export function getMatchesDiscoveryPreviewItems(
  result: DiscoveryRunResponse | null,
): DiscoveryRunPreviewItem[] {
  return result?.items.flatMap((item) => item.previewItems) ?? [];
}

export function mergeMatchesDiscoveryResultsForSource(
  currentResults: readonly DiscoveryRunResponse[],
  nextResults: readonly DiscoveryRunResponse[],
  sourceId: string,
): DiscoveryRunResponse[] {
  const retained = currentResults
    .map((result) => ({
      ...result,
      warnings: result.warnings.filter((warning) => !warning.includes(`:${sourceId}:`)),
      items: result.items.filter((item) => item.sourceId !== sourceId),
    }))
    .filter((result) => result.items.length > 0 || result.warnings.length > 0);

  return [...retained, ...nextResults];
}

export function appendMatchesDiscoveryResultsForSource(
  currentResults: readonly DiscoveryRunResponse[],
  nextResults: readonly DiscoveryRunResponse[],
  sourceId: string,
): DiscoveryRunResponse[] {
  const nextWarnings = new Set(
    nextResults.flatMap((result) =>
      result.warnings.filter((warning) => warning.includes(`:${sourceId}:`)),
    ),
  );
  return [
    ...currentResults.map((result) => ({
      ...result,
      warnings: result.warnings.filter((warning) => !nextWarnings.has(warning)),
    })),
    ...nextResults,
  ];
}

export function getMatchesDiscoveryResponseDedupeKeysForSource(
  results: readonly DiscoveryRunResponse[],
  sourceId: string,
): string[] {
  return results.flatMap((result) =>
    result.items
      .filter((item) => item.sourceId === sourceId)
      .flatMap((item) =>
        item.previewItems.map((previewItem) =>
          getMatchesDiscoveryPreviewDedupeKey({
            sourceId,
            externalId: previewItem.externalId,
            sourceUrl: previewItem.sourceUrl,
          }),
        ),
      ),
  );
}

export function getMatchesDiscoveryPreviewItemKey(
  item: DiscoveryRunPreviewItem,
): string {
  return item.externalId ?? item.sourceUrl;
}

export function getMatchesDiscoveryPreviewDedupeKey(
  entry: MatchesDiscoveryPreviewDedupeInput,
): string {
  const sourceId = entry.sourceId.trim().toLowerCase() || "unknown";
  const externalId = entry.externalId?.trim().toLowerCase();
  return `${sourceId}:${externalId || normalizeDiscoveryPreviewUrl(entry.sourceUrl)}`;
}

export function getMatchesDiscoverySavedPreviewKey(entry: {
  loopId: string;
  sourceId: string | null | undefined;
  externalId?: string | null;
  sourceUrl: string;
}): string {
  return `${entry.loopId}:${getMatchesDiscoveryPreviewDedupeKey({
    sourceId: entry.sourceId ?? "",
    externalId: entry.externalId,
    sourceUrl: entry.sourceUrl,
  })}`;
}

export function dedupeMatchesDiscoveryPreviewEntries<
  T extends MatchesDiscoveryPreviewDedupeInput,
>(entries: readonly T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const entry of entries) {
    const key = getMatchesDiscoveryPreviewDedupeKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function normalizeDiscoveryPreviewUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    url.hash = "";
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    const value = url.toString();
    return value.endsWith("/") ? value.slice(0, -1) : value;
  } catch {
    let s = sourceUrl.trim().toLowerCase();
    while (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  }
}

export function getMatchesDiscoverySaveButtonLabel(
  state: MatchesDiscoverySaveState,
): string {
  if (state === "saving") return MATCHES_DISCOVERY_COPY.saving;
  if (state === "saved") return MATCHES_DISCOVERY_COPY.saved;
  if (state === "duplicate") return MATCHES_DISCOVERY_COPY.duplicate;
  return MATCHES_DISCOVERY_COPY.saveAsMatch;
}

export function isMatchesDiscoverySaveDisabled(
  state: MatchesDiscoverySaveState,
): boolean {
  return state === "saving" || state === "saved" || state === "duplicate";
}

export function isMatchesDiscoverySavedState(state: MatchesDiscoverySaveState): boolean {
  return state === "saved" || state === "duplicate";
}

export function compareMatchesDiscoverySaveState(
  left: MatchesDiscoverySaveState,
  right: MatchesDiscoverySaveState,
): number {
  const rank = (state: MatchesDiscoverySaveState) =>
    isMatchesDiscoverySavedState(state) ? 1 : 0;
  return rank(left) - rank(right);
}

const WARNING_MESSAGES: Record<string, string> = {
  automatic_discovery_not_available:
    "Этот источник пока не поддерживает предварительный поиск.",
  automatic_match_persistence_not_enabled:
    "Автоматическое сохранение пока не включено.",
  source_not_found: "Источник не найден в реестре.",
  source_disabled: "Источник сейчас выключен.",
  no_sources_selected:
    "Выберите поддерживаемый источник в настройках направления поиска.",
  no_selected_sources:
    "Выберите поддерживаемый источник в настройках направления поиска.",
  source_not_selected:
    "Выберите поддерживаемый источник в настройках направления поиска.",
  arbeitsagentur_requires_search_terms:
    "Добавьте профессию или ключевые слова в настройки направления поиска.",
  arbeitsagentur_timeout: "Источник временно недоступен. Попробуйте позже.",
  arbeitsagentur_api_unavailable: "Источник временно недоступен. Попробуйте позже.",
  arbeitsagentur_invalid_response:
    "Источник вернул неожиданный ответ. Попробуйте позже.",
  adzuna_not_configured:
    "Adzuna требует серверные ключи ADZUNA_APP_ID и ADZUNA_APP_KEY. Источник можно оставить выбранным, но он заработает после настройки.",
  adzuna_requires_search_terms:
    "Добавьте профессию, ключевые слова или город в настройки направления поиска.",
  adzuna_timeout: "Adzuna временно недоступен. Попробуйте позже.",
  adzuna_api_unavailable: "Adzuna временно недоступен. Попробуйте позже.",
  adzuna_invalid_response: "Adzuna вернул неожиданный ответ. Попробуйте позже.",
  arbeitnow_requires_search_terms:
    "Add a role or keywords in the search direction settings for Arbeitnow.",
  arbeitnow_timeout: "Arbeitnow is temporarily unavailable. Try again later.",
  arbeitnow_api_unavailable: "Arbeitnow is temporarily unavailable. Try again later.",
  arbeitnow_invalid_response: "Arbeitnow returned an unexpected response. Try again later.",
  remotive_requires_search_terms:
    "Добавьте профессию или ключевые слова в настройки направления поиска.",
  remotive_timeout: "Remotive временно недоступен. Попробуйте позже.",
  remotive_api_unavailable: "Remotive временно недоступен. Попробуйте позже.",
  remotive_invalid_response: "Remotive вернул неожиданный ответ. Попробуйте позже.",
  remotejobs_requires_search_terms:
    "Add a role or keywords in the search direction settings for RemoteJobs.org.",
  remotejobs_timeout: "RemoteJobs.org is temporarily unavailable. Try again later.",
  remotejobs_api_unavailable: "RemoteJobs.org is temporarily unavailable. Try again later.",
  remotejobs_invalid_response: "RemoteJobs.org returned an unexpected response. Try again later.",
  himalayas_requires_search_terms:
    "Add a role or keywords in the search direction settings for Himalayas.",
  himalayas_timeout: "Himalayas is temporarily unavailable. Try again later.",
  himalayas_api_unavailable: "Himalayas is temporarily unavailable. Try again later.",
  himalayas_invalid_response: "Himalayas returned an unexpected response. Try again later.",
  remoteok_requires_search_terms:
    "Add a role or keywords in the search direction settings for Remote OK.",
  remoteok_timeout: "Remote OK is temporarily unavailable. Try again later.",
  remoteok_api_unavailable: "Remote OK is temporarily unavailable. Try again later.",
  remoteok_invalid_response: "Remote OK returned an unexpected response. Try again later.",
  greenhouse_not_configured:
    "Greenhouse работает по настроенному списку компаний. Добавьте GREENHOUSE_BOARD_TOKENS на сервере.",
  greenhouse_timeout: "Greenhouse временно недоступен. Попробуйте позже.",
  greenhouse_api_unavailable: "Greenhouse временно недоступен. Попробуйте позже.",
  greenhouse_invalid_response:
    "Greenhouse вернул неожиданный ответ. Попробуйте позже.",
  lever_not_configured:
    "Lever работает по настроенному списку компаний. Добавьте LEVER_SITE_NAMES на сервере.",
  lever_timeout: "Lever временно недоступен. Попробуйте позже.",
  lever_api_unavailable: "Lever временно недоступен. Попробуйте позже.",
  lever_invalid_response: "Lever вернул неожиданный ответ. Попробуйте позже.",
  source_adapter_failed: "Источник временно недоступен. Попробуйте позже.",
};

const SILENT_DISCOVERY_CODES = new Set([
  "adapter_preview_ready",
  "arbeitsagentur_dry_run_preview_only",
  "adzuna_dry_run_preview_only",
  "arbeitnow_dry_run_preview_only",
  "remotive_dry_run_preview_only",
  "remotejobs_dry_run_preview_only",
  "himalayas_dry_run_preview_only",
  "remoteok_dry_run_preview_only",
  "greenhouse_dry_run_preview_only",
  "lever_dry_run_preview_only",
]);

export function getMatchesDiscoveryWarningMessage(code: string): string {
  return WARNING_MESSAGES[code] ?? code;
}

export function collectMatchesDiscoveryMessages(
  result: DiscoveryRunResponse | null,
): string[] {
  if (!result) return [];

  const codes = [
    ...result.warnings.map((warning) => warning.split(":").at(-1) ?? warning),
    ...result.items.flatMap((item) => [
      item.reason,
      ...item.warnings,
      ...item.errors,
    ]),
  ];

  return [
    ...new Set(
      codes
        .filter(Boolean)
        .filter((code) => !SILENT_DISCOVERY_CODES.has(code))
        .map(getMatchesDiscoveryWarningMessage),
    ),
  ];
}

export function collectMatchesDiscoveryMessagesFromResults(
  results: readonly DiscoveryRunResponse[],
): string[] {
  return [
    ...new Set(results.flatMap((result) => collectMatchesDiscoveryMessages(result))),
  ];
}

export function collectMatchesDiscoveryGlobalMessagesFromResults(
  results: readonly DiscoveryRunResponse[],
): string[] {
  const codes = results.flatMap((result) =>
    result.warnings
      .map((warning) => warning.split(":"))
      .filter((parts) => parts.length < 3)
      .map((parts) => parts.at(-1) ?? ""),
  );

  return [
    ...new Set(
      codes
        .filter(Boolean)
        .filter((code) => !SILENT_DISCOVERY_CODES.has(code))
        .map(getMatchesDiscoveryWarningMessage),
    ),
  ];
}

export function collectMatchesDiscoveryMessagesForSource(
  results: readonly DiscoveryRunResponse[],
  sourceId: string,
): string[] {
  const codes = results.flatMap((result) => [
    ...result.warnings
      .map((warning) => warning.split(":"))
      .filter((parts) => parts[1] === sourceId)
      .map((parts) => parts.at(-1) ?? ""),
    ...result.items
      .filter((item) => item.sourceId === sourceId)
      .flatMap((item) => [item.reason, ...item.warnings, ...item.errors]),
  ]);

  return [
    ...new Set(
      codes
        .filter(Boolean)
        .filter((code) => !SILENT_DISCOVERY_CODES.has(code))
        .map(getMatchesDiscoveryWarningMessage),
    ),
  ];
}

export function getMatchesDiscoveryCopyText(): string {
  return Object.values(MATCHES_DISCOVERY_COPY).join(" ");
}

export function formatMatchesDiscoveryLastUpdated(
  updatedAt: Date | null,
): string {
  if (!updatedAt) return MATCHES_DISCOVERY_COPY.notUpdatedYet;

  const hours = String(updatedAt.getHours()).padStart(2, "0");
  const minutes = String(updatedAt.getMinutes()).padStart(2, "0");
  return `${MATCHES_DISCOVERY_COPY.lastUpdatedPrefix}: ${hours}:${minutes}`;
}

export function formatMatchesDiscoveryHiddenDuplicates(count: number): string | null {
  return count > 0 ? `${MATCHES_DISCOVERY_COPY.hiddenDuplicatesPrefix}: ${count}` : null;
}

export function formatMatchesDiscoverySourceResultLabel(
  count: number,
  hasMore: boolean | undefined,
  savedCount = 0,
  hiddenByUserCount = 0,
): string {
  if (count <= 0) return "Пока нет результатов";

  const newCount = Math.max(0, count - savedCount);
  const newSuffix = savedCount > 0 ? `. Новых: ${newCount}` : "";
  const savedSuffix = savedCount > 0 ? `. Уже сохранено: ${savedCount}` : "";
  const hiddenByUserSuffix =
    hiddenByUserCount > 0
      ? `. ${MATCHES_DISCOVERY_COPY.hiddenByUserPrefix}: ${hiddenByUserCount}`
      : "";
  const moreSuffix = hasMore ? ". Есть ещё" : "";
  return `Найдено: ${count}${newSuffix}${savedSuffix}${hiddenByUserSuffix}${moreSuffix}`;
}
