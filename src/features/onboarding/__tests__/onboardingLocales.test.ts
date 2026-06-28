import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ONBOARDING_STEPS } from "../model/onboardingSteps";

type Json = Record<string, unknown>;

function load(lang: string): Json {
  return JSON.parse(
    readFileSync(join(process.cwd(), `src/shared/locales/onboarding/${lang}.json`), "utf8"),
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

// Every English baseline key resolves to a non-empty string in ru and de.
for (const key of collectKeys(en)) {
  for (const [lang, data] of [
    ["ru", ru],
    ["de", de],
  ] as const) {
    const value = getValue(data, key);
    assert.equal(typeof value, "string", `${lang}.json is missing onboarding key: ${key}`);
    assert.ok(
      (value as string).trim().length > 0,
      `${lang}.json has an empty onboarding value at: ${key}`,
    );
  }
}

// Every step in the config has title/body copy in all three languages. The
// bundle is registered as "onboarding", so the JSON path drops that prefix.
const localKey = (fullKey: string) => fullKey.replace(/^onboarding\./, "");
for (const step of ONBOARDING_STEPS) {
  for (const fullKey of [step.titleKey, step.bodyKey]) {
    const key = localKey(fullKey);
    for (const [lang, data] of [
      ["en", en],
      ["ru", ru],
      ["de", de],
    ] as const) {
      assert.equal(typeof getValue(data, key), "string", `${lang}.json is missing ${key}`);
    }
  }
}

// Tour/restart chrome keys exist in the baseline.
for (const key of [
  "tour.skip",
  "tour.back",
  "tour.next",
  "tour.finish",
  "tour.progress",
  "tour.comingSoon",
  "restart.label",
]) {
  assert.equal(typeof getValue(en, key), "string", `en.json is missing onboarding ${key}`);
}

console.log("onboardingLocales.test passed");
