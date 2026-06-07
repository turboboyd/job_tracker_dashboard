import assert from "node:assert/strict";

import type { Loop } from "src/entities/loop";
import type {
  DiscoveryRunPreviewItem,
  DiscoveryRunResponse,
} from "src/features/discoveryRuns";
import type {
  VacancyMatch,
  VacancyMatchEvaluation,
  VacancyMatchListEnvelope,
} from "src/features/vacancyMatches";

import {
  buildLoopMetaLine,
  buildMergedMatchesFeed,
  countMatchesByStatus,
  filterMatches,
  formatCountdownClock,
  formatTimeUntil,
  getDuplicateLabel,
  getEvaluationVerdict,
  getLoopPlatformCount,
  getLoopSyncState,
  getMatchDedupeKey,
  getMatchFreshnessTs,
  getVacancyMeta,
  getVacancyMetaChips,
  isMatchUnseen,
  localizeEvaluationPenalty,
  localizeEvaluationReason,
  pluralRu,
  previewItemToMatch,
  sortMatches,
  type LoopMatchesResult,
  type LoopPreviewResult,
  type MatchWithLoopName,
} from "../matchesV2.helpers";

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

function match(rawMetadata: Record<string, unknown>): VacancyMatch {
  return {
    id: "m1",
    userId: "u1",
    loopId: "l1",
    sourceUrl: "https://example.com/job/1",
    source: "arbeitnow",
    externalId: null,
    companyName: "Acme",
    roleTitle: "Frontend Engineer",
    locationText: "Berlin",
    vacancyDescription: null,
    rawMetadata,
    confidence: {},
    warnings: [],
    status: "new",
    applicationId: null,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-04T09:00:00.000Z",
  };
}

// --- pluralRu -------------------------------------------------------------
assert.equal(pluralRu(1, "вакансия", "вакансии", "вакансий"), "вакансия");
assert.equal(pluralRu(2, "вакансия", "вакансии", "вакансий"), "вакансии");
assert.equal(pluralRu(5, "вакансия", "вакансии", "вакансий"), "вакансий");
assert.equal(pluralRu(11, "вакансия", "вакансии", "вакансий"), "вакансий");
assert.equal(pluralRu(21, "вакансия", "вакансии", "вакансий"), "вакансия");
assert.equal(pluralRu(112, "вакансия", "вакансии", "вакансий"), "вакансий");

// --- getLoopSyncState -----------------------------------------------------
assert.deepEqual(getLoopSyncState(loop({ id: "a", name: "A", status: "active" })), {
  isActive: true,
  label: "Синхронизация активна",
});
assert.deepEqual(getLoopSyncState(loop({ id: "b", name: "B", status: "paused" })), {
  isActive: false,
  label: "Синхронизация на паузе",
});
assert.equal(
  getLoopSyncState(loop({ id: "c", name: "C", autoDiscoveryEnabled: false })).isActive,
  false,
);

// --- getLoopPlatformCount -------------------------------------------------
assert.equal(
  getLoopPlatformCount(loop({ id: "d", name: "D", selectedSources: ["linkedin", "xing"] })),
  2,
);
assert.equal(
  getLoopPlatformCount(
    loop({ id: "e", name: "E", platforms: ["linkedin", "indeed", "xing"] }),
  ),
  3,
);
assert.equal(getLoopPlatformCount(loop({ id: "f", name: "F" })), 0);

// --- formatTimeUntil ------------------------------------------------------
const now = Date.parse("2026-06-04T12:00:00.000Z");
assert.equal(formatTimeUntil(null, now), null);
assert.equal(formatTimeUntil("2026-06-04T11:00:00.000Z", now), null); // past
assert.equal(formatTimeUntil("2026-06-04T12:13:00.000Z", now), "13 минут");
assert.equal(formatTimeUntil("2026-06-04T12:01:00.000Z", now), "1 минуту");
assert.equal(formatTimeUntil("2026-06-04T14:30:00.000Z", now), "2 ч 30 мин");
assert.equal(formatTimeUntil("2026-06-04T15:00:00.000Z", now), "3 ч");
assert.equal(formatTimeUntil("2026-06-07T12:00:00.000Z", now), "3 дня");

// --- formatCountdownClock -------------------------------------------------
assert.equal(formatCountdownClock(null, now), null);
assert.equal(formatCountdownClock("2026-06-04T11:59:00.000Z", now), "00:00"); // past clamps
assert.equal(formatCountdownClock("2026-06-04T12:13:42.000Z", now), "13:42");
assert.equal(formatCountdownClock("2026-06-04T13:05:09.000Z", now), "01:05:09");

// --- buildLoopMetaLine ----------------------------------------------------
const richLoop = loop({
  id: "g",
  name: "Frontend EU",
  platforms: ["linkedin", "stepstone", "indeed", "xing", "glassdoor", "wellfound", "lever"],
  lastDiscoveryAt: "2026-06-04T11:58:00.000Z",
  nextRunAt: "2026-06-04T12:13:00.000Z",
});
assert.equal(
  buildLoopMetaLine(richLoop, 30, now),
  "30 вакансий · 7 платформ · обновлено 2 мин назад · следующий запуск через 13 минут",
);

// No scheduling data → just the vacancy count segment.
assert.equal(buildLoopMetaLine(loop({ id: "h", name: "H" }), 1, now), "1 вакансия");

// --- getVacancyMeta -------------------------------------------------------
// Arbeitnow shape: remote bool + job_types[] + posted_at.
assert.deepEqual(
  getVacancyMeta(
    match({
      remote: true,
      job_types: ["full_time"],
      posted_at: "2026-06-04T08:00:00.000Z",
    }),
  ),
  {
    salary: null,
    salaryEstimated: false,
    workMode: "Удалённо",
    employment: "Полная занятость",
    postedAt: "2026-06-04T08:00:00.000Z",
  },
);

// Adzuna shape: contract_type only; no posted/work-mode/salary.
assert.deepEqual(getVacancyMeta(match({ contract_type: "permanent", category: "IT" })), {
  salary: null,
  salaryEstimated: false,
  workMode: null,
  employment: "Полная занятость",
  postedAt: null,
});

// Salary from numeric min/max + currency.
assert.equal(
  getVacancyMeta(match({ salary_min: 70000, salary_max: 90000, currency: "EUR" })).salary,
  "70k–90k EUR",
);
assert.equal(
  getVacancyMeta(match({ salary_min: 70000, salary_max: 90000, currency: "EUR" })).salaryEstimated,
  false,
);
// Predicted salary (Adzuna salary_is_predicted) gets the "≈" mark + estimated flag.
const predicted = getVacancyMeta(
  match({ salary_min: 70000, salary_max: 90000, salary_currency: "EUR", salary_is_predicted: true }),
);
assert.equal(predicted.salary, "≈70k–90k EUR");
assert.equal(predicted.salaryEstimated, true);
// Predicted single-bound keeps the mark next to the number.
assert.equal(
  getVacancyMeta(match({ salary_min: 70000, salary_is_predicted: "1" })).salary,
  "от ≈70k",
);
// Explicit salary strings are never treated as estimates.
assert.equal(
  getVacancyMeta(match({ salary: "€85,000/year", salary_is_predicted: true })).salaryEstimated,
  false,
);
// Explicit salary string wins over numbers.
assert.equal(getVacancyMeta(match({ salary: "€85,000/year" })).salary, "€85,000/year");
// Work-mode string normalization.
assert.equal(getVacancyMeta(match({ work_mode: "Hybrid" })).workMode, "Гибрид");
// Invalid posted_at is ignored.
assert.equal(getVacancyMeta(match({ posted_at: "not-a-date" })).postedAt, null);

// --- getVacancyMetaChips --------------------------------------------------
assert.deepEqual(
  getVacancyMetaChips(
    match({
      remote: true,
      job_types: ["contract"],
      posted_at: "2026-06-04T08:00:00.000Z",
    }),
    now,
  ),
  [
    { key: "workMode", label: "Удалённо" },
    { key: "employment", label: "Контракт" },
    { key: "posted", label: "Опубликовано 4 ч назад" },
  ],
);
// Empty metadata → no chips.
assert.deepEqual(getVacancyMetaChips(match({}), now), []);
// Estimated salary chip carries the "≈" label and an explanatory title.
const estimatedChips = getVacancyMetaChips(
  match({ salary_min: 70000, salary_max: 90000, salary_currency: "EUR", salary_is_predicted: true }),
  now,
);
assert.equal(estimatedChips[0].key, "salary");
assert.equal(estimatedChips[0].label, "≈70k–90k EUR");
assert.equal(typeof estimatedChips[0].title, "string");
// A non-estimated salary chip has no title.
const exactChips = getVacancyMetaChips(
  match({ salary_min: 70000, salary_max: 90000, salary_currency: "EUR" }),
  now,
);
assert.equal(exactChips[0].title, undefined);

// --- localizeEvaluationReason / Penalty -----------------------------------
assert.equal(
  localizeEvaluationReason("Role title matches Loop target terms: react, developer."),
  "Должность совпадает с целью цикла: react, developer",
);
assert.equal(localizeEvaluationReason("Matched keyword: react."), "Совпало ключевое слово: react");
assert.equal(
  localizeEvaluationReason("Location matches Loop location."),
  "Локация совпадает с циклом",
);
assert.equal(localizeEvaluationReason("No excluded keywords found."), "Стоп-слов не найдено");
// Unknown reason passes through untouched.
assert.equal(localizeEvaluationReason("Some custom reason"), "Some custom reason");
assert.equal(
  localizeEvaluationPenalty("Matched excluded keyword: senior."),
  "Найдено стоп-слово: senior",
);
assert.equal(
  localizeEvaluationPenalty("Source is not selected for this Loop."),
  "Источник не выбран в цикле",
);

// --- getDuplicateLabel ----------------------------------------------------
assert.equal(getDuplicateLabel("none"), null);
assert.equal(getDuplicateLabel("exact_duplicate"), "Точный дубликат");

// --- getEvaluationVerdict -------------------------------------------------
function evaluation(patch: Partial<VacancyMatchEvaluation>): VacancyMatchEvaluation {
  return {
    matchId: "m1",
    loopId: "l1",
    totalScore: 0,
    titleMatchScore: 0,
    locationMatchScore: 0,
    employmentTypeMatchScore: 0,
    workModeMatchScore: 0,
    keywordScore: 0,
    excludedKeywordPenalty: 0,
    sourceScore: 0,
    reasons: [],
    penalties: [],
    duplicateStatus: "none",
    duplicateOfMatchId: null,
    duplicateApplicationId: null,
    duplicateReasons: [],
    ...patch,
  };
}
assert.equal(getEvaluationVerdict(evaluation({ totalScore: 82 })).tone, "positive");
// High score but with a penalty → not "positive".
assert.equal(
  getEvaluationVerdict(evaluation({ totalScore: 82, penalties: ["x"] })).tone,
  "neutral",
);
assert.equal(getEvaluationVerdict(evaluation({ totalScore: 60 })).tone, "neutral");
assert.equal(getEvaluationVerdict(evaluation({ totalScore: 20 })).tone, "caution");
// Exact duplicate always wins, regardless of score.
assert.equal(
  getEvaluationVerdict(evaluation({ totalScore: 95, duplicateStatus: "exact_duplicate" })).tone,
  "caution",
);

// --- getMatchDedupeKey ----------------------------------------------------
// externalId (when present) is the stable identity, regardless of URL.
assert.equal(
  getMatchDedupeKey(match({})),
  // match() fixture has source="arbeitnow", externalId=null, url=…/job/1
  "arbeitnow:url:https://example.com/job/1",
);
function dbMatch(patch: Partial<VacancyMatch>): VacancyMatch {
  return { ...match({}), ...patch };
}
assert.equal(
  getMatchDedupeKey(dbMatch({ externalId: "x1" })),
  "arbeitnow:id:x1",
);
// Trailing slashes are stripped so .../1 and .../1/ collapse to one key.
assert.equal(
  getMatchDedupeKey(dbMatch({ externalId: null, sourceUrl: "https://example.com/job/1///" })),
  "arbeitnow:url:https://example.com/job/1",
);

// --- previewItemToMatch ---------------------------------------------------
function previewItem(patch: Partial<DiscoveryRunPreviewItem>): DiscoveryRunPreviewItem {
  return {
    externalId: "p1",
    sourceUrl: "https://example.com/job/p1",
    title: "Backend Engineer",
    company: "Globex",
    location: "Munich",
    snippet: "A role.",
    postedAt: null,
    rawMetadata: {},
    confidence: {},
    insight: null,
    ...patch,
  };
}
const synthesized = previewItemToMatch("loop-1", "arbeitnow", previewItem({}));
assert.equal(synthesized.id, "preview:loop-1:arbeitnow:p1");
assert.equal(synthesized.status, "new");
assert.equal(synthesized.source, "arbeitnow");
assert.equal(synthesized.externalId, "p1");
// insight score is surfaced under confidence.score so it ranks like a real match.
assert.equal(
  previewItemToMatch("loop-1", "arbeitnow", previewItem({ insight: { score: 73, matched: [], missing: [] } }))
    .confidence.score,
  73,
);

// --- buildMergedMatchesFeed -----------------------------------------------
function matchesEnvelope(items: VacancyMatch[]): VacancyMatchListEnvelope {
  return { items, total: items.length, limit: 200, offset: 0 };
}
function runResponse(
  items: DiscoveryRunResponse["items"],
): DiscoveryRunResponse {
  return {
    runId: "run-1",
    status: "completed",
    dryRun: true,
    loopsChecked: 1,
    sourcesChecked: 1,
    matchesCreated: 0,
    matchesPreviewed: items.length,
    warnings: [],
    items,
  };
}
function runItem(patch: Partial<DiscoveryRunResponse["items"][number]>): DiscoveryRunResponse["items"][number] {
  return {
    loopId: "loop-1",
    sourceId: "arbeitnow",
    status: "would_run",
    reason: "preview",
    message: "",
    itemsPreviewed: 0,
    previewItems: [],
    warnings: [],
    errors: [],
    ...patch,
  };
}

const feedLoop = loop({ id: "loop-1", name: "Backend EU" });

// DB match + a live preview for the *same* externalId → one row (no double count).
const dbResults: LoopMatchesResult[] = [
  { loop: feedLoop, response: matchesEnvelope([dbMatch({ externalId: "dup", status: "saved" })]) },
];
const previewResultsDup: LoopPreviewResult[] = [
  {
    loop: feedLoop,
    response: runResponse([
      runItem({ previewItems: [previewItem({ externalId: "dup", sourceUrl: "https://other.example/x" })] }),
    ]),
  },
];
const dedupFeed = buildMergedMatchesFeed(dbResults, previewResultsDup);
assert.equal(dedupFeed.items.length, 1);
assert.equal(dedupFeed.items[0]?.isPreview ?? false, false); // persisted row wins
assert.equal(dedupFeed.warmingCount, 0);

// A fresh preview (unseen externalId) is appended as an isPreview row.
const previewResultsNew: LoopPreviewResult[] = [
  {
    loop: feedLoop,
    response: runResponse([runItem({ previewItems: [previewItem({ externalId: "fresh" })] })]),
  },
];
const mixedFeed = buildMergedMatchesFeed(dbResults, previewResultsNew);
assert.equal(mixedFeed.items.length, 2);
const freshRow = mixedFeed.items.find((row) => row.match.externalId === "fresh");
assert.equal(freshRow?.isPreview, true);
assert.equal(freshRow?.preview?.sourceId, "arbeitnow");
assert.equal(freshRow?.loopName, "Backend EU");

// cache_warming run items contribute no rows but bump warmingCount.
const warmingFeed = buildMergedMatchesFeed(
  [],
  [{ loop: feedLoop, response: runResponse([runItem({ reason: "cache_warming" })]) }],
);
assert.equal(warmingFeed.items.length, 0);
assert.equal(warmingFeed.warmingCount, 1);

// A failed preview fetch (response: null) is skipped without throwing.
const nullPreviewFeed = buildMergedMatchesFeed(dbResults, [{ loop: feedLoop, response: null }]);
assert.equal(nullPreviewFeed.items.length, 1);
assert.equal(nullPreviewFeed.warmingCount, 0);

// --- buildMergedMatchesFeed: per-loop enabled-source filter ---------------
// A loop that only enables "arbeitnow" must hide vacancies from other sources,
// both persisted (linkedin) and live previews (indeed) — only arbeitnow rows pass.
const sourceScopedLoop = loop({ id: "loop-1", name: "Backend EU", selectedSources: ["arbeitnow"] });
const scopedDbResults: LoopMatchesResult[] = [
  {
    loop: sourceScopedLoop,
    response: matchesEnvelope([
      dbMatch({ externalId: "keep", source: "arbeitnow" }),
      dbMatch({ externalId: "drop", source: "linkedin", sourceUrl: "https://example.com/job/li" }),
    ]),
  },
];
const scopedPreviewResults: LoopPreviewResult[] = [
  {
    loop: sourceScopedLoop,
    response: runResponse([
      runItem({ sourceId: "arbeitnow", previewItems: [previewItem({ externalId: "anw-fresh" })] }),
      runItem({ sourceId: "indeed", previewItems: [previewItem({ externalId: "indeed-fresh" })] }),
    ]),
  },
];
const scopedFeed = buildMergedMatchesFeed(scopedDbResults, scopedPreviewResults);
assert.deepEqual(
  scopedFeed.items.map((r) => r.match.externalId).sort(),
  ["anw-fresh", "keep"],
);

// Two loops, each enabling a different source → both loops show, each only its source.
const loopA = loop({ id: "A", name: "Loop A", selectedSources: ["arbeitsagentur"] });
const loopB = loop({ id: "B", name: "Loop B", selectedSources: ["arbeitnow"] });
const twoLoopFeed = buildMergedMatchesFeed(
  [
    {
      loop: loopA,
      response: matchesEnvelope([
        dbMatch({ externalId: "a-ok", source: "arbeitsagentur" }),
        dbMatch({ externalId: "a-no", source: "arbeitnow", sourceUrl: "https://example.com/job/a-no" }),
      ]),
    },
    {
      loop: loopB,
      response: matchesEnvelope([
        dbMatch({ externalId: "b-ok", source: "arbeitnow", sourceUrl: "https://example.com/job/b-ok" }),
        dbMatch({ externalId: "b-no", source: "arbeitsagentur", sourceUrl: "https://example.com/job/b-no" }),
      ]),
    },
  ],
  [],
);
assert.deepEqual(
  twoLoopFeed.items.map((r) => `${r.loopName}:${r.match.externalId}`).sort(),
  ["Loop A:a-ok", "Loop B:b-ok"],
);

// A loop with NO selected sources imposes no constraint (legacy/unconfigured → show all).
const unconstrainedFeed = buildMergedMatchesFeed(
  [
    {
      loop: loop({ id: "u", name: "Loop U" }),
      response: matchesEnvelope([
        dbMatch({ externalId: "u1", source: "linkedin" }),
        dbMatch({ externalId: "u2", source: "indeed", sourceUrl: "https://example.com/job/u2" }),
      ]),
    },
  ],
  [],
);
assert.equal(unconstrainedFeed.items.length, 2);

// --- getMatchFreshnessTs --------------------------------------------------
// Real source publish date (posted_at) wins over createdAt.
assert.equal(
  getMatchFreshnessTs(
    dbMatch({
      rawMetadata: { posted_at: "2026-06-05T00:00:00.000Z" },
      createdAt: "2026-06-01T00:00:00.000Z",
    }),
  ),
  Date.parse("2026-06-05T00:00:00.000Z"),
);
// No posted_at → falls back to createdAt.
assert.equal(
  getMatchFreshnessTs(dbMatch({ rawMetadata: {}, createdAt: "2026-06-02T00:00:00.000Z" })),
  Date.parse("2026-06-02T00:00:00.000Z"),
);
// Unparseable timestamps collapse to 0 (sink to bottom).
assert.equal(getMatchFreshnessTs(dbMatch({ rawMetadata: {}, createdAt: "nope" })), 0);

// --- sortMatches: "posted" = freshest first -------------------------------
function row(id: string, patch: Partial<VacancyMatch>): MatchWithLoopName {
  return { loopName: "L", match: dbMatch({ id, ...patch }) };
}
const freshnessRows: MatchWithLoopName[] = [
  // older publish date, but newest createdAt — publish date must win.
  row("old-posted", {
    rawMetadata: { posted_at: "2026-06-01T00:00:00.000Z" },
    createdAt: "2026-06-09T00:00:00.000Z",
  }),
  row("new-posted", {
    rawMetadata: { posted_at: "2026-06-08T00:00:00.000Z" },
    createdAt: "2026-06-02T00:00:00.000Z",
  }),
  // no publish date → ranked by createdAt.
  row("created-mid", { rawMetadata: {}, createdAt: "2026-06-05T00:00:00.000Z" }),
];
const sortedByPosted = sortMatches(freshnessRows, "posted");
assert.deepEqual(
  sortedByPosted.map((r) => r.match.id),
  ["new-posted", "created-mid", "old-posted"],
);
// sortMatches does not mutate the input array.
assert.equal(freshnessRows[0]?.match.id, "old-posted");

// --- isMatchUnseen / «Новые» = unseen -------------------------------------
const WATERMARK = "2026-06-05T00:00:00.000Z";
// Persisted match created AFTER the watermark → unseen.
assert.equal(
  isMatchUnseen({ match: dbMatch({ createdAt: "2026-06-06T00:00:00.000Z" }) }, WATERMARK),
  true,
);
// Persisted match created BEFORE the watermark → seen.
assert.equal(
  isMatchUnseen({ match: dbMatch({ createdAt: "2026-06-04T00:00:00.000Z" }) }, WATERMARK),
  false,
);
// Null watermark (never marked seen) → everything is unseen.
assert.equal(
  isMatchUnseen({ match: dbMatch({ createdAt: "2026-06-04T00:00:00.000Z" }) }, null),
  true,
);
// Live preview rows are always unseen, regardless of createdAt vs. watermark.
assert.equal(
  isMatchUnseen(
    { isPreview: true, match: dbMatch({ createdAt: "2026-06-01T00:00:00.000Z" }) },
    WATERMARK,
  ),
  true,
);

// --- filterMatches: status "new" filters by unseen, not status ------------
function feedRow(id: string, patch: Partial<VacancyMatch>, isPreview = false): MatchWithLoopName {
  const base: MatchWithLoopName = { loopName: "L", match: dbMatch({ id, ...patch }) };
  return isPreview ? { ...base, isPreview: true } : base;
}
const watermarkFeed: MatchWithLoopName[] = [
  feedRow("seen-new", { status: "new", createdAt: "2026-06-04T00:00:00.000Z" }),
  feedRow("unseen-new", { status: "new", createdAt: "2026-06-06T00:00:00.000Z" }),
  feedRow("saved-old", { status: "saved", createdAt: "2026-06-04T00:00:00.000Z" }),
  feedRow("preview-row", { status: "new", createdAt: "2026-06-01T00:00:00.000Z" }, true),
];
const newTab = filterMatches(watermarkFeed, {
  q: "",
  source: "",
  status: "new",
  loopId: "",
  watermark: WATERMARK,
});
// «Новые» = unseen rows: the post-watermark match + the always-unseen preview.
assert.deepEqual(
  newTab.map((r) => r.match.id).sort(),
  ["preview-row", "unseen-new"],
);
// «Сохранённые» still filters by persisted status, ignoring the watermark.
const savedTab = filterMatches(watermarkFeed, {
  q: "",
  source: "",
  status: "saved",
  loopId: "",
  watermark: WATERMARK,
});
assert.deepEqual(savedTab.map((r) => r.match.id), ["saved-old"]);

// --- countMatchesByStatus: «Новые» counts unseen --------------------------
const counts = countMatchesByStatus(watermarkFeed, WATERMARK);
assert.equal(counts.all, 4);
assert.equal(counts.new, 2); // unseen-new + preview-row
assert.equal(counts.saved, 1);
assert.equal(counts.converted, 0);
assert.equal(counts.ignored, 0);
// With a null watermark, every row counts as new.
assert.equal(countMatchesByStatus(watermarkFeed, null).new, 4);

console.log("matchesV2.helpers.test passed");
