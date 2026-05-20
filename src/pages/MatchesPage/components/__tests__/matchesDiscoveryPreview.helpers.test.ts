import assert from "node:assert/strict";

import type { Loop } from "src/entities/loop";

import {
  appendMatchesDiscoveryResultsForSource,
  collectMatchesDiscoveryMessages,
  collectMatchesDiscoveryMessagesForSource,
  collectMatchesDiscoveryGlobalMessagesFromResults,
  collectMatchesDiscoveryMessagesFromResults,
  compareMatchesDiscoverySaveState,
  dedupeMatchesDiscoveryPreviewEntries,
  formatMatchesDiscoveryHiddenDuplicates,
  formatMatchesDiscoveryLastUpdated,
  formatMatchesDiscoverySetupSummary,
  formatMatchesDiscoverySourceResultLabel,
  getMatchesDiscoveryDiagnosticsGroups,
  getMatchesDiscoveryEmptySourceMessage,
  getMatchesDiscoveryCopyText,
  getMatchesDiscoveryLoopOptions,
  getMatchesDiscoveryPreviewItemKey,
  getMatchesDiscoveryPreviewDedupeKey,
  getMatchesDiscoveryPreviewItems,
  getMatchesDiscoveryResponseDedupeKeysForSource,
  getMatchesDiscoverySavedPreviewKey,
  getMatchesDiscoverySaveButtonLabel,
  getMatchesDiscoverySourceFilterOptions,
  getMatchesDiscoverySourceStatusItems,
  getMatchesDiscoverySourceStatusSummary,
  getMatchesDiscoveryTargetLoopIds,
  getRunnableDiscoverySourceIds,
  getRunnableDiscoverySourceLabel,
  getMatchesDiscoveryWarningMessage,
  getPreferredMatchesDiscoveryLoopId,
  isMatchesDiscoverySaveDisabled,
  isMatchesDiscoverySavedState,
  mergeMatchesDiscoveryResultsForSource,
  MATCHES_DISCOVERY_COPY,
  MATCHES_DISCOVERY_SEARCH_SCOPE_OPTIONS,
} from "../matchesDiscoveryPreview.helpers";

function loop(patch: Partial<Loop> & Pick<Loop, "id" | "name">): Loop {
  const { id, name, ...rest } = patch;
  return {
    id,
    name,
    title: name,
    titles: [],
    targetRole: "",
    location: "",
    radiusKm: 30,
    selectedSources: [],
    remoteMode: "any",
    platforms: [],
    status: "active",
    ...rest,
  };
}

const loops = [
  loop({ id: "loop-a", name: "Frontend", selectedSources: ["arbeitsagentur", "remotive"] }),
  loop({ id: "loop-b", name: "Backend", selectedSources: ["linkedin"] }),
  loop({
    id: "loop-c",
    name: "Archived",
    selectedSources: ["arbeitsagentur"],
    status: "archived",
  }),
];

const options = getMatchesDiscoveryLoopOptions(loops);
assert.deepEqual(options, [
  {
    id: "loop-a",
    name: "Frontend",
    sourceIds: [
      "arbeitsagentur",
      "arbeitnow",
      "adzuna",
      "remotive",
      "remotejobs",
      "himalayas",
      "remoteok",
      "greenhouse",
      "lever",
    ],
  },
  {
    id: "loop-b",
    name: "Backend",
    sourceIds: [
      "arbeitsagentur",
      "arbeitnow",
      "adzuna",
      "remotive",
      "remotejobs",
      "himalayas",
      "remoteok",
      "greenhouse",
      "lever",
    ],
  },
]);
assert.equal(getPreferredMatchesDiscoveryLoopId(options, ["loop-b", "loop-a"]), "loop-b");
assert.equal(getPreferredMatchesDiscoveryLoopId(options, []), "loop-a");
assert.equal(getPreferredMatchesDiscoveryLoopId([], ["loop-a"]), "");
assert.deepEqual(getMatchesDiscoveryTargetLoopIds(options, "all", []), ["loop-a", "loop-b"]);
assert.deepEqual(getMatchesDiscoveryTargetLoopIds(options, "loop-a", []), ["loop-a"]);
assert.deepEqual(getMatchesDiscoveryTargetLoopIds(options, "missing", []), []);
assert.deepEqual(getMatchesDiscoveryTargetLoopIds(options, "all", ["loop-a"]), ["loop-a"]);
assert.deepEqual(getRunnableDiscoverySourceIds(["linkedin", "adzuna", "lever"]), [
  "adzuna",
  "lever",
]);
assert.equal(getRunnableDiscoverySourceLabel("greenhouse"), "Greenhouse");
assert.equal(getRunnableDiscoverySourceLabel("unknown"), "unknown");
assert.equal(formatMatchesDiscoveryLastUpdated(null), "Ещё не обновлялось");
assert.equal(
  formatMatchesDiscoveryLastUpdated(new Date(2026, 4, 17, 9, 5)),
  "Обновлено: 09:05",
);
assert.equal(formatMatchesDiscoveryHiddenDuplicates(0), null);
assert.equal(formatMatchesDiscoveryHiddenDuplicates(3), "Скрыто дублей: 3");
assert.equal(formatMatchesDiscoverySourceResultLabel(0, false), "Пока нет результатов");
assert.equal(formatMatchesDiscoverySourceResultLabel(2, false), "Найдено: 2");
assert.equal(formatMatchesDiscoverySourceResultLabel(5, true), "Найдено: 5. Есть ещё");
assert.equal(
  formatMatchesDiscoverySourceResultLabel(5, true, 2),
  "Найдено: 5. Новых: 3. Уже сохранено: 2. Есть ещё",
);
assert.equal(
  formatMatchesDiscoverySourceResultLabel(5, true, 2, 1),
  "Найдено: 5. Новых: 3. Уже сохранено: 2. Скрыто вручную: 1. Есть ещё",
);
assert.equal(
  getMatchesDiscoverySavedPreviewKey({
    loopId: "loop-1",
    sourceId: "Arbeitsagentur",
    externalId: " JOB-1 ",
    sourceUrl: "https://example.test/other",
  }),
  "loop-1:arbeitsagentur:job-1",
);
assert.equal(
  getMatchesDiscoverySavedPreviewKey({
    loopId: "loop-1",
    sourceId: "remotive",
    externalId: null,
    sourceUrl: "https://Example.test/job-1/",
  }),
  "loop-1:remotive:https://example.test/job-1",
);
assert.deepEqual(
  getMatchesDiscoverySourceFilterOptions([
    "remotive",
    "arbeitsagentur",
    "remotive",
    "linkedin",
    "lever",
  ]),
  [
    { id: "all", label: "Все источники", count: 5 },
    { id: "arbeitsagentur", label: "Arbeitsagentur", count: 1 },
    { id: "remotive", label: "Remotive", count: 2 },
    { id: "lever", label: "Lever", count: 1 },
  ],
);
assert.deepEqual(getMatchesDiscoverySourceFilterOptions(["arbeitsagentur"], ["remotive"]), [
  { id: "all", label: "Все источники", count: 1 },
  { id: "arbeitsagentur", label: "Arbeitsagentur", count: 1 },
  { id: "remotive", label: "Remotive", count: 0 },
]);

const sourceStatuses = getMatchesDiscoverySourceStatusItems();
assert.equal(sourceStatuses.length, 9);
assert.equal(sourceStatuses.some((item) => item.sourceId === "arbeitnow"), true);
assert.equal(sourceStatuses.some((item) => item.sourceId === "remotejobs"), true);
assert.equal(sourceStatuses.some((item) => item.sourceId === "himalayas"), true);
assert.equal(sourceStatuses.some((item) => item.sourceId === "remoteok"), true);
assert.equal(sourceStatuses.some((item) => item.sourceId === "adzuna"), true);
assert.equal(
  sourceStatuses.some((item) => item.description.includes("ADZUNA_APP_ID")),
  true,
);
assert.equal(
  getMatchesDiscoverySourceStatusItems([
    {
      sourceId: "adzuna",
      name: "Adzuna Germany",
      automaticDiscovery: true,
      configured: false,
      runnable: false,
      configurationStatus: "not_configured",
      messageCode: "adzuna_not_configured",
    },
    {
      sourceId: "remotive",
      name: "Remotive",
      automaticDiscovery: true,
      configured: true,
      runnable: true,
      configurationStatus: "ready",
      messageCode: "source_ready",
    },
  ]).find((item) => item.sourceId === "adzuna")?.statusLabel,
  "Нужна настройка",
);
assert.equal(
  getMatchesDiscoverySourceStatusItems([
    {
      sourceId: "linkedin",
      name: "LinkedIn",
      automaticDiscovery: false,
      configured: true,
      runnable: false,
      configurationStatus: "not_runnable",
      messageCode: "automatic_discovery_not_available",
    },
  ]).find((item) => item.sourceId === "remotive")?.statusLabel,
  "Готов",
);
assert.equal(
  sourceStatuses.some((item) => item.description.includes("GREENHOUSE_BOARD_TOKENS")),
  true,
);
assert.equal(
  sourceStatuses.some((item) => item.description.includes("LEVER_SITE_NAMES")),
  true,
);
assert.deepEqual(getMatchesDiscoverySourceStatusSummary(sourceStatuses), {
  ready: 6,
  needsSetup: 3,
  unavailable: 0,
  total: 9,
  label: "Готово источников: 6/9. Нужна настройка: 3.",
});
assert.equal(
  formatMatchesDiscoverySetupSummary(sourceStatuses),
  "Без ключей готовы: 6. Требуют настройки: 3.",
);
assert.equal(
  getMatchesDiscoveryEmptySourceMessage(
    sourceStatuses.find((item) => item.sourceId === "remotive"),
  ),
  "Источник готов, но по текущим словам ничего не нашёл. Попробуйте режим «Шире», упростите профессию или добавьте город.",
);
assert.equal(
  getMatchesDiscoveryEmptySourceMessage(
    sourceStatuses.find((item) => item.sourceId === "adzuna"),
  ),
  "Источник подключён, но требует серверной настройки перед поиском вакансий.",
);
assert.equal(
  getMatchesDiscoveryEmptySourceMessage(
    sourceStatuses.find((item) => item.sourceId === "arbeitsagentur"),
    "Источник временно недоступен. Попробуйте позже.",
  ),
  "Источник временно недоступен. Попробуйте позже.",
);
assert.deepEqual(
  getMatchesDiscoveryDiagnosticsGroups(sourceStatuses).map((group) => ({
    title: group.title,
    items: group.items.map((item) => item.sourceId),
  })),
  [
    {
      title: "Готовы без ключей (6)",
      items: ["arbeitsagentur", "arbeitnow", "remotive", "remotejobs", "himalayas", "remoteok"],
    },
    {
      title: "Требуют настройки (3)",
      items: ["adzuna", "greenhouse", "lever"],
    },
  ],
);

assert.equal(
  getMatchesDiscoveryWarningMessage("automatic_discovery_not_available"),
  "Этот источник пока не поддерживает предварительный поиск.",
);
assert.equal(
  getMatchesDiscoveryWarningMessage("arbeitsagentur_requires_search_terms"),
  "Добавьте профессию или ключевые слова в настройки направления поиска.",
);

const result = {
  runId: "run-1",
  status: "completed_with_warnings" as const,
  dryRun: true,
  loopsChecked: 1,
  sourcesChecked: 1,
  matchesCreated: 0,
  matchesPreviewed: 1,
  warnings: ["loop-a:arbeitsagentur:automatic_match_persistence_not_enabled"],
  items: [
    {
      loopId: "loop-a",
      sourceId: "arbeitsagentur",
      status: "would_run" as const,
      reason: "adapter_preview_ready",
      message: "ok",
      itemsPreviewed: 1,
      warnings: ["arbeitsagentur_requires_search_terms"],
      errors: [],
      previewItems: [
        {
          externalId: "job-1",
          sourceUrl: "https://example.test/job-1",
          title: "Frontend Engineer",
          company: "Example GmbH",
          location: "Berlin",
          snippet: "React role",
          postedAt: null,
          rawMetadata: {},
          confidence: { source_quality: 0.8 },
        },
      ],
    },
  ],
};

assert.equal(getMatchesDiscoveryPreviewItems(result).length, 1);
assert.equal(
  getMatchesDiscoveryPreviewItemKey(result.items[0].previewItems[0]),
  "job-1",
);
assert.equal(
  getMatchesDiscoveryPreviewDedupeKey({
    sourceId: "Remotive",
    externalId: " JOB-1 ",
    sourceUrl: "https://example.test/other",
  }),
  "remotive:job-1",
);
assert.deepEqual(
  getMatchesDiscoveryResponseDedupeKeysForSource([result], "arbeitsagentur"),
  ["arbeitsagentur:job-1"],
);
assert.deepEqual(getMatchesDiscoveryResponseDedupeKeysForSource([result], "remotive"), []);
assert.deepEqual(
  dedupeMatchesDiscoveryPreviewEntries([
    {
      sourceId: "remotive",
      externalId: null,
      sourceUrl: "https://Example.test/job-1/",
      label: "first",
    },
    {
      sourceId: "remotive",
      externalId: null,
      sourceUrl: "https://example.test/job-1",
      label: "duplicate",
    },
    {
      sourceId: "arbeitsagentur",
      externalId: null,
      sourceUrl: "https://example.test/job-1",
      label: "different-source",
    },
  ]).map((entry) => entry.label),
  ["first", "different-source"],
);
assert.equal(
  collectMatchesDiscoveryMessages(result).includes(
    "Автоматическое сохранение пока не включено.",
  ),
  true,
);
assert.equal(collectMatchesDiscoveryMessages(result).includes("adapter_preview_ready"), false);
assert.deepEqual(
  collectMatchesDiscoveryMessagesFromResults([result]),
  collectMatchesDiscoveryMessages(result),
);
assert.deepEqual(collectMatchesDiscoveryGlobalMessagesFromResults([result]), []);
assert.deepEqual(collectMatchesDiscoveryMessagesForSource([result], "arbeitsagentur"), [
  "Автоматическое сохранение пока не включено.",
  "Добавьте профессию или ключевые слова в настройки направления поиска.",
]);
assert.deepEqual(collectMatchesDiscoveryMessagesForSource([result], "remotive"), []);
assert.deepEqual(
  mergeMatchesDiscoveryResultsForSource(
    [
      result,
      {
        ...result,
        runId: "run-2",
        warnings: ["loop-a:remotive:remotive_timeout"],
        items: [
          {
            ...result.items[0],
            sourceId: "remotive",
            previewItems: [
              {
                ...result.items[0].previewItems[0],
                externalId: "job-2",
                sourceUrl: "https://example.test/job-2",
              },
            ],
          },
        ],
      },
    ],
    [
      {
        ...result,
        runId: "run-3",
        warnings: [],
        items: [
          {
            ...result.items[0],
            sourceId: "remotive",
            previewItems: [
              {
                ...result.items[0].previewItems[0],
                externalId: "job-3",
                sourceUrl: "https://example.test/job-3",
              },
            ],
          },
        ],
      },
    ],
    "remotive",
  ).flatMap((item) => item.items.map((runItem) => runItem.sourceId)),
  ["arbeitsagentur", "remotive"],
);

assert.deepEqual(
  appendMatchesDiscoveryResultsForSource(
    [result],
    [
      {
        ...result,
        runId: "run-4",
        warnings: ["loop-a:remotive:remotive_timeout"],
        items: [
          {
            ...result.items[0],
            sourceId: "remotive",
            previewItems: [
              {
                ...result.items[0].previewItems[0],
                externalId: "job-4",
                sourceUrl: "https://example.test/job-4",
              },
            ],
          },
        ],
      },
    ],
    "remotive",
  ).flatMap((item) => item.items.map((runItem) => runItem.sourceId)),
  ["arbeitsagentur", "remotive"],
);

assert.equal(getMatchesDiscoverySaveButtonLabel("idle"), "Сохранить как совпадение");
assert.equal(getMatchesDiscoverySaveButtonLabel("saving"), "Сохраняем...");
assert.equal(getMatchesDiscoverySaveButtonLabel("saved"), "Сохранено");
assert.equal(getMatchesDiscoverySaveButtonLabel("duplicate"), "Уже сохранено");
assert.equal(isMatchesDiscoverySaveDisabled("idle"), false);
assert.equal(isMatchesDiscoverySaveDisabled("saving"), true);
assert.equal(isMatchesDiscoverySaveDisabled("saved"), true);
assert.equal(isMatchesDiscoverySaveDisabled("duplicate"), true);
assert.equal(isMatchesDiscoverySavedState("idle"), false);
assert.equal(isMatchesDiscoverySavedState("saving"), false);
assert.equal(isMatchesDiscoverySavedState("saved"), true);
assert.equal(isMatchesDiscoverySavedState("duplicate"), true);
assert.equal(compareMatchesDiscoverySaveState("idle", "duplicate"), -1);
assert.equal(compareMatchesDiscoverySaveState("saved", "idle"), 1);
assert.equal(compareMatchesDiscoverySaveState("saving", "idle"), 0);

const copy = getMatchesDiscoveryCopyText();
assert.equal(copy.includes("не сохраняются автоматически."), true);
assert.equal(copy.includes("Заявка не создаётся автоматически."), true);
assert.equal(copy.includes("Adzuna"), true);
assert.equal(copy.includes("RemoteJobs.org"), true);
assert.equal(copy.includes("Greenhouse"), true);
assert.equal(copy.includes("Lever"), true);
assert.equal(MATCHES_DISCOVERY_COPY.runButton, "Обновить вакансии");
assert.equal(MATCHES_DISCOVERY_COPY.refreshSource, "Обновить");
assert.equal(MATCHES_DISCOVERY_COPY.hideSavedToggle, "Скрыть сохранённые");
assert.equal(MATCHES_DISCOVERY_COPY.notInterested, "Не интересно");
assert.equal(MATCHES_DISCOVERY_COPY.restorePreviewItem, "Вернуть в preview");
assert.equal(MATCHES_DISCOVERY_COPY.hiddenByUserPrefix, "Скрыто вручную");
assert.equal(MATCHES_DISCOVERY_COPY.showHiddenPreviewItems, "Показать скрытые");
assert.equal(
  MATCHES_DISCOVERY_COPY.allPreviewItemsHiddenByUser,
  "Все найденные вакансии скрыты вручную в текущей сессии просмотра.",
);
assert.equal(
  MATCHES_DISCOVERY_COPY.allPreviewItemsHiddenAsSaved,
  "Все найденные вакансии уже сохранены и скрыты фильтром сохранённых.",
);
assert.equal(MATCHES_DISCOVERY_COPY.showSavedPreviewItems, "Показать сохранённые");
assert.deepEqual(
  MATCHES_DISCOVERY_SEARCH_SCOPE_OPTIONS.map((option) => option.id),
  ["broad", "normal", "focused"],
);

const forbiddenSearchDirectionWords = new RegExp(
  [`ци${"кл"}`, `ци${"клы"}`, `cy${"cle"}`].join("|"),
  "i",
);
assert.equal(forbiddenSearchDirectionWords.test(copy), false);
