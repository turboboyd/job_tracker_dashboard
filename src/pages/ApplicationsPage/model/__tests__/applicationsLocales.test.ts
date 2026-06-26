import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Json = Record<string, unknown>;

function load(lang: string): Json {
  return JSON.parse(
    readFileSync(join(process.cwd(), `src/pages/ApplicationsPage/locales/${lang}.json`), "utf8"),
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
// ru/de user never sees a raw key or an empty label on the Applications page.
for (const key of collectKeys(en)) {
  for (const [lang, data] of [
    ["ru", ru],
    ["de", de],
  ] as const) {
    const value = getValue(data, key);
    assert.equal(typeof value, "string", `${lang}.json is missing applications key: ${key}`);
    assert.ok(
      (value as string).trim().length > 0,
      `${lang}.json has an empty applications value at: ${key}`,
    );
  }
}

// Guard the Stage 12 migration: the live page UI keys must exist in the baseline.
const requiredKeys = [
  "applicationsPage.searchPlaceholder",
  "applicationsPage.newApplication",
  "applicationsPage.subtitle",
  "applicationsPage.views.pipeline",
  "applicationsPage.sort.newest",
  "applicationsPage.sort.score",
  "applicationsPage.filters.title",
  "applicationsPage.filters.companies",
  "applicationsPage.filters.favorites",
  "applicationsPage.loopBanner.label",
  "applicationsPage.archiveTabs.active",
  "applicationsPage.archiveTabs.archived",
  "applicationsPage.meta.showing",
  "applicationsPage.meta.range",
  "applicationsPage.meta.back",
  "applicationsPage.meta.next",
  "applicationsPage.displayMode.list",
  "applicationsPage.displayMode.cards",
  "applicationsPage.columns.role",
  "applicationsPage.columns.matchTitle",
  "applicationsPage.item.favoriteAdd",
  "applicationsPage.item.restore",
  "applicationsPage.item.archive",
  "applicationsPage.item.direction",
  "applicationsPage.list.noMatch",
  "applicationsPage.confirm.archive",
  "applicationsPage.errors.archivedLoop",
  "applicationsPage.import.fallback",
  "applicationsPage.import.invalidUrl",
  "applicationsPage.create.cancel",
  "applicationsPage.create.loopField",
  "applicationsPage.create.loopPlaceholder",
  "applicationsPage.create.manual",
  "applicationsPage.create.importTab",
  "applicationsPage.create.importHint",
  "applicationsPage.create.previewReady",
  "applicationsPage.create.loadingLoops",
  "applicationsPage.create.noLoopsTitle",
  "applicationsPage.create.goToLoops",
];

for (const key of requiredKeys) {
  assert.equal(
    typeof getValue(en, key),
    "string",
    `en.json is missing required Stage 12 key: ${key}`,
  );
}

console.log("applicationsLocales.test passed");
