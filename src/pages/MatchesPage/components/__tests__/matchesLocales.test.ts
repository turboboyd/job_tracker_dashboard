import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Json = Record<string, unknown>;

function load(lang: string): Json {
  return JSON.parse(
    readFileSync(join(process.cwd(), `src/pages/MatchesPage/locales/${lang}.json`), "utf8"),
  ) as Json;
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.keys(value as Json).flatMap((key) =>
    collectKeys((value as Json)[key], prefix ? `${prefix}.${key}` : key),
  );
}

function getValue(obj: Json, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Json)[part];
    return undefined;
  }, obj);
}

const en = load("en");
const ru = load("ru");
const de = load("de");

// Every English baseline key resolves to a non-empty string in ru and de, so a
// ru/de user never sees a raw key or an empty label on the Matches page.
for (const key of collectKeys(en)) {
  for (const [lang, data] of [
    ["ru", ru],
    ["de", de],
  ] as const) {
    const value = getValue(data, key);
    assert.equal(typeof value, "string", `${lang}.json is missing matches key: ${key}`);
    assert.ok(
      (value as string).trim().length > 0,
      `${lang}.json has an empty matches value at: ${key}`,
    );
  }
}

// The Stage 10 V2 page UI is fully translation-key driven — guard the namespaces
// the live components depend on (header/tabs/toolbar/sort/sources/matchStatus/
// item/feed/empty/autoRefresh/detail/evaluation).
const requiredV2Keys = [
  "header.title",
  "header.backToLoop",
  "header.vacancies",
  "header.subtitleSingle",
  "header.subtitleMulti",
  "header.refresh",
  "header.refreshing",
  "tabs.all",
  "tabs.new",
  "tabs.saved",
  "toolbar.searchPlaceholder",
  "toolbar.sortLabel",
  "sort.posted",
  "sort.company",
  "sort.loop",
  "sources.all",
  "sources.empty",
  "matchStatus.new",
  "matchStatus.saved",
  "matchStatus.converted",
  "item.untitled",
  "item.seen",
  "item.topMatch",
  "feed.vacanciesWord",
  "feed.pageOf",
  "feed.loading",
  "feed.emptyTitle",
  "feed.emptyHint",
  "empty.loadingLoops",
  "empty.noLoops",
  "autoRefresh.label",
  "detail.selectPrompt",
  "detail.convert",
  "detail.saving",
  "detail.save",
  "detail.openOn",
  "detail.more",
  "detail.scoreLabel",
  "detail.scoreHint",
  "detail.meta.loop",
  "detail.meta.source",
  "detail.technologies",
  "detail.aboutRole",
  "evaluation.heading",
  "evaluation.analyzing",
  "evaluation.noReasons",
  "evaluation.verdict.strongTitle",
  "evaluation.verdict.weakDetail",
];

for (const key of requiredV2Keys) {
  assert.equal(
    typeof getValue(en, key),
    "string",
    `en.json is missing required V2 matches key: ${key}`,
  );
}

console.log("matchesLocales.test passed");
