import assert from "node:assert/strict";

import type { Loop } from "src/entities/loop";
import type { VacancyMatch, VacancyMatchEvaluation } from "src/features/vacancyMatches";

import {
  buildLoopMetaLine,
  buildSourceBuckets,
  formatCountdownClock,
  formatTimeUntil,
  getDuplicateLabel,
  getEvaluationVerdict,
  getLoopPlatformCount,
  getLoopSyncState,
  getMatchScore,
  getSourceColor,
  getSourceLabel,
  getVacancyMeta,
  getVacancyMetaChips,
  isLoopVisibleInMatches,
  isMatchSeen,
  localizeEvaluationPenalties,
  localizeEvaluationPenalty,
  localizeEvaluationReason,
  localizeEvaluationReasons,
  parsePageParam,
  parseSort,
  parseTab,
  pluralRu,
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
    seenAt: null,
    postedAt: null,
    score: null,
    scoreVersion: null,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-04T09:00:00.000Z",
  };
}

function dbMatch(patch: Partial<VacancyMatch>): VacancyMatch {
  return { ...match({}), ...patch };
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

// --- isLoopVisibleInMatches -----------------------------------------------
// A loop contributes to the Matches feed only when active AND it has at least
// one selected source; paused/archived and sourceless loops are hidden.
assert.equal(
  isLoopVisibleInMatches(
    loop({ id: "a", name: "A", status: "active", selectedSources: ["arbeitsagentur"] }),
  ),
  true,
);
// Active but all sources removed → searches nothing → not a contributing cycle.
assert.equal(
  isLoopVisibleInMatches(loop({ id: "a0", name: "A0", status: "active", selectedSources: [] })),
  false,
);
assert.equal(
  isLoopVisibleInMatches(
    loop({ id: "b", name: "B", status: "paused", selectedSources: ["arbeitsagentur"] }),
  ),
  false,
);
assert.equal(
  isLoopVisibleInMatches(
    loop({ id: "c", name: "C", status: "archived", selectedSources: ["arbeitsagentur"] }),
  ),
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

// --- getSourceLabel / getSourceColor --------------------------------------
assert.equal(getSourceLabel("linkedin"), "LinkedIn");
assert.equal(getSourceLabel("arbeitnow"), "Arbeitnow");
// Unknown source → capitalized id; nullish → "Другое".
assert.equal(getSourceLabel("acme"), "Acme");
assert.equal(getSourceLabel(null), "Другое");
assert.equal(getSourceColor("linkedin"), "#0a66c2");
// Unknown / nullish source → shared fallback color.
assert.equal(getSourceColor("totally-unknown"), getSourceColor(null));

// --- buildSourceBuckets ---------------------------------------------------
// Union of the visible loops' enabled sources, de-duped/normalized, ordered by
// the product source priority (legal boards first, LinkedIn after all board/API
// sources), and carrying NO counts (server feed has no per-source totals).
const buckets = buildSourceBuckets([
  loop({ id: "1", name: "One", selectedSources: ["linkedin", "Arbeitnow"] }),
  loop({ id: "2", name: "Two", selectedSources: ["arbeitnow", "indeed", "  "] }),
]);
assert.deepEqual(
  buckets.map((bucket) => bucket.key),
  ["indeed", "arbeitnow", "linkedin"],
);
assert.deepEqual(
  buckets.map((bucket) => bucket.label),
  ["Indeed", "Arbeitnow", "LinkedIn"],
);
// No counts are attached for the server-driven feed.
assert.equal(buckets.every((bucket) => bucket.count === undefined), true);
// Colors are populated from the source palette.
assert.equal(buckets.find((bucket) => bucket.key === "linkedin")?.color, "#0a66c2");
// Loops with no selected sources contribute nothing.
assert.deepEqual(buildSourceBuckets([loop({ id: "x", name: "X" })]), []);

// --- isMatchSeen ----------------------------------------------------------
assert.equal(isMatchSeen(dbMatch({ seenAt: "2026-06-05T00:00:00.000Z" })), true);
assert.equal(isMatchSeen(dbMatch({ seenAt: null })), false);

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
    reasonCodes: [],
    penaltyCodes: [],
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

// --- getMatchScore --------------------------------------------------------
// Prefers the backend-owned top-level score; never computes one client-side.
assert.equal(getMatchScore(dbMatch({ score: 73 })), 73);
assert.equal(getMatchScore(dbMatch({ score: 72.6 })), 73); // rounded
// Null top-level score with no legacy confidence → null (neutral fallback).
assert.equal(getMatchScore(dbMatch({ score: null })), null);
// Legacy confidence.score is used only when the top-level score is absent.
assert.equal(getMatchScore(dbMatch({ score: null, confidence: { score: 41 } })), 41);
// Top-level score wins over a stale legacy confidence value.
assert.equal(getMatchScore(dbMatch({ score: 80, confidence: { score: 41 } })), 80);

// --- localizeEvaluationReasons / Penalties (code-first, string fallback) ---
// Prefers reason_codes when present.
assert.deepEqual(
  localizeEvaluationReasons(
    evaluation({
      reasonCodes: [
        { code: "title_match", terms: ["frontend", "developer"] },
        { code: "keyword_matched", terms: ["react"] },
        { code: "location_match", terms: [] },
        { code: "source_selected", terms: [] },
        { code: "no_excluded_keywords", terms: [] },
      ],
      // Legacy strings present but must be ignored when codes exist.
      reasons: ["IGNORED"],
    }),
  ),
  [
    "Должность совпадает с целью цикла: frontend, developer",
    "Совпало ключевое слово: react",
    "Локация совпадает с циклом",
    "Источник включён в цикл",
    "Стоп-слов не найдено",
  ],
);
// Falls back to legacy English strings when no codes are present.
assert.deepEqual(
  localizeEvaluationReasons(evaluation({ reasons: ["Matched keyword: react."] })),
  ["Совпало ключевое слово: react"],
);
// Penalties: code-first, then string fallback.
assert.deepEqual(
  localizeEvaluationPenalties(
    evaluation({
      penaltyCodes: [
        { code: "excluded_keyword", terms: ["senior"] },
        { code: "source_not_selected", terms: [] },
      ],
    }),
  ),
  ["Найдено стоп-слово: senior", "Источник не выбран в цикле"],
);
assert.deepEqual(
  localizeEvaluationPenalties(
    evaluation({ penalties: ["Source is not selected for this Loop."] }),
  ),
  ["Источник не выбран в цикле"],
);

// --- URL state parsers (drive the backend feed query from the URL) ---------
// Unknown/missing params fall back to the canonical defaults so a hand-edited
// URL can never put the feed into an invalid tab/sort/page.
assert.equal(parseTab("new"), "new");
assert.equal(parseTab("saved"), "saved");
assert.equal(parseTab("all"), "all");
assert.equal(parseTab("bogus"), "all");
assert.equal(parseTab(null), "all");

assert.equal(parseSort("company"), "company");
assert.equal(parseSort("loop"), "loop");
assert.equal(parseSort("posted"), "posted");
assert.equal(parseSort("bogus"), "posted");
assert.equal(parseSort(null), "posted");

assert.equal(parsePageParam("3"), 3);
assert.equal(parsePageParam("1"), 1);
assert.equal(parsePageParam(null), 1);
assert.equal(parsePageParam("0"), 1);
assert.equal(parsePageParam("-2"), 1);
assert.equal(parsePageParam("abc"), 1);

console.log("matchesV2.helpers.test passed");
