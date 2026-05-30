import assert from "node:assert/strict";

import {
  createLoopSettingsDraft,
  DISCOVERY_SOURCE_OPTIONS,
  getLoopSettingsOptionLabel,
  getLoopSettingsSourceStatusLabel,
  mapLoopSettingsDraftToPatch,
  normalizeSettingsListText,
} from "../loopSettingsPanel.helpers";

function test(_name: string, run: () => void) {
  run();
}

test("normalizeSettingsListText trims comma and newline separated values", () => {
  assert.deepEqual(
    normalizeSettingsListText("React, TypeScript\nreact\n  Node.js  "),
    ["React", "TypeScript", "Node.js"],
  );
});

test("createLoopSettingsDraft renders backend settings as editable text", () => {
  const draft = createLoopSettingsDraft({
    keywords: ["React", "TypeScript"],
    excludedKeywords: ["Angular"],
    employmentTypes: ["full_time"],
    workModes: ["hybrid"],
    selectedSources: ["linkedin", "indeed"],
    discoveryRadiusKm: 50,
  });

  assert.equal(draft.keywordsText, "React\nTypeScript");
  assert.equal(draft.excludedKeywordsText, "Angular");
  assert.deepEqual(draft.employmentTypes, ["full_time"]);
  assert.deepEqual(draft.workModes, ["hybrid"]);
  assert.deepEqual(draft.selectedSources, ["linkedin", "indeed"]);
  assert.equal(draft.discoveryRadiusKmText, "50");
});

test("mapLoopSettingsDraftToPatch creates backend Loop settings patch", () => {
  const patch = mapLoopSettingsDraftToPatch({
    keywordsText: "React, TypeScript",
    excludedKeywordsText: "Angular",
    employmentTypes: ["full_time"],
    workModes: ["remote"],
    selectedSources: ["linkedin", "indeed"],
    discoveryRadiusKmText: "100",
    autoDiscoveryEnabled: false,
    discoveryIntervalHoursText: "24",
  });

  assert.deepEqual(patch, {
    keywords: ["React", "TypeScript"],
    excludedKeywords: ["Angular"],
    employmentTypes: ["full_time"],
    workModes: ["remote"],
    selectedSources: ["linkedin", "indeed"],
    discoveryRadiusKm: 100,
    autoDiscoveryEnabled: false,
  });
});

test("mapLoopSettingsDraftToPatch omits blank radius", () => {
  const patch = mapLoopSettingsDraftToPatch({
    keywordsText: "",
    excludedKeywordsText: "",
    employmentTypes: [],
    workModes: [],
    selectedSources: [],
    discoveryRadiusKmText: " ",
    autoDiscoveryEnabled: false,
    discoveryIntervalHoursText: "24",
  });

  assert.equal("discoveryRadiusKm" in patch, false);
});

test("mapLoopSettingsDraftToPatch includes interval when auto-discovery enabled", () => {
  const patch = mapLoopSettingsDraftToPatch({
    keywordsText: "",
    excludedKeywordsText: "",
    employmentTypes: [],
    workModes: [],
    selectedSources: [],
    discoveryRadiusKmText: "",
    autoDiscoveryEnabled: true,
    discoveryIntervalHoursText: "12",
  });

  assert.equal(patch.autoDiscoveryEnabled, true);
  assert.equal(patch.discoveryIntervalHours, 12);
});

test("source ids map to friendly labels while patches keep backend ids", () => {
  assert.equal(
    getLoopSettingsOptionLabel("manual_url", DISCOVERY_SOURCE_OPTIONS),
    "Вручную по ссылке",
  );
  assert.equal(
    getLoopSettingsOptionLabel("company_websites", DISCOVERY_SOURCE_OPTIONS),
    "Сайты компаний",
  );

  const patch = mapLoopSettingsDraftToPatch({
    keywordsText: "",
    excludedKeywordsText: "",
    employmentTypes: [],
    workModes: [],
    selectedSources: ["manual_url", "linkedin"],
    discoveryRadiusKmText: "",
    autoDiscoveryEnabled: false,
    discoveryIntervalHoursText: "24",
  });

  assert.deepEqual(patch.selectedSources, ["manual_url", "linkedin"]);
});

test("source status labels explain configured and future sources", () => {
  assert.equal(
    getLoopSettingsSourceStatusLabel("adzuna", [
      {
        sourceId: "adzuna",
        name: "Adzuna Germany",
        automaticDiscovery: true,
        configured: false,
        runnable: false,
        configurationStatus: "not_configured",
        messageCode: "adzuna_not_configured",
      },
    ]),
    "Нужна настройка сервера",
  );
  assert.equal(
    getLoopSettingsSourceStatusLabel("remotive", [
      {
        sourceId: "remotive",
        name: "Remotive",
        automaticDiscovery: true,
        configured: true,
        runnable: true,
        configurationStatus: "ready",
        messageCode: "source_ready",
      },
    ]),
    "Готов к preview",
  );
  assert.equal(
    getLoopSettingsSourceStatusLabel("linkedin", [
      {
        sourceId: "linkedin",
        name: "LinkedIn",
        automaticDiscovery: false,
        configured: true,
        runnable: false,
        configurationStatus: "not_runnable",
        messageCode: "automatic_discovery_not_available",
      },
    ]),
    "Только ручной/будущий источник",
  );
  assert.equal(getLoopSettingsSourceStatusLabel("manual_url", null), "Ручное добавление");
});
