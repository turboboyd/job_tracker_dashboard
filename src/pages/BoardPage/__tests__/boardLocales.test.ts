import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Json = Record<string, unknown>;

function load(lang: string): Json {
  return JSON.parse(
    readFileSync(join(process.cwd(), `src/pages/BoardPage/locales/${lang}.json`), "utf8"),
  ) as Json;
}

// Flatten to dotted leaf paths. Note the board bundle mixes nested keys
// (column.ACTIVE) with literal-dotted keys (status.applied); both flatten to the
// same comparable string, so we never split on "." for lookup.
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.assign(
      {},
      ...Object.keys(value as Json).map((key) =>
        flatten((value as Json)[key], prefix ? `${prefix}.${key}` : key),
      ),
    );
  }
  return prefix ? { [prefix]: String(value) } : {};
}

const en = flatten(load("en"));
const ru = flatten(load("ru"));
const de = flatten(load("de"));

const enKeys = Object.keys(en).sort();

// en/ru/de must expose the exact same key set.
assert.deepEqual(Object.keys(ru).sort(), enKeys, "ru board keys differ from en baseline");
assert.deepEqual(Object.keys(de).sort(), enKeys, "de board keys differ from en baseline");

// Every value is a non-empty string in all three languages.
for (const key of enKeys) {
  for (const [lang, map] of [
    ["en", en],
    ["ru", ru],
    ["de", de],
  ] as const) {
    assert.ok(map[key].trim().length > 0, `${lang}.json has an empty board value at: ${key}`);
  }
}

// Keys referenced by the BoardPage UI (previously hardcoded / used-but-missing)
// must exist in the baseline.
const requiredKeys = [
  "title",
  "subtitle",
  "dropHere",
  "empty",
  "loading",
  "archive",
  "archiveConfirm",
  "allLoops",
  "search",
  "newApplication",
  "total",
  "column.ACTIVE",
  "column.INTERVIEW",
  "column.OFFER",
  "column.REJECTED",
  "column.NO_RESPONSE",
  "column.ARCHIVED",
];
for (const key of requiredKeys) {
  assert.ok(key in en, `en.json is missing required board key: ${key}`);
}

console.log("boardLocales.test passed");
