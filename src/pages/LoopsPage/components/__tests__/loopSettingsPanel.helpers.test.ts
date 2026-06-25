import assert from "node:assert/strict";

import {
  createLoopSettingsDraft,
  DISCOVERY_SOURCE_OPTIONS,
  getLoopSettingsOptionLabel,
  getLoopSettingsSourceStatusLabel,
  mapLoopSettingsDraftToPatch,
  mergeKnownAndSelectedOptions,
  normalizeSettingsListText,
  sortSourcesByPriority,
  toggleSettingsValue,
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

test("source status fallbacks preserve categories and status presence", () => {
  const readySources = [
    "arbeitsagentur",
    "remotive",
    "arbeitnow",
    "remotejobs",
    "himalayas",
    "remoteok",
  ];
  const configurationSources = ["adzuna", "greenhouse", "lever"];
  const previewUnavailableSources = [
    "stepstone",
    "indeed",
    "linkedin",
    "xing",
  ];

  for (const sourceId of readySources) {
    assert.equal(
      getLoopSettingsSourceStatusLabel(sourceId),
      "Статус проверяется",
    );
    assert.equal(
      getLoopSettingsSourceStatusLabel(sourceId, []),
      "Готов к preview",
    );
  }

  for (const sourceId of configurationSources) {
    assert.equal(
      getLoopSettingsSourceStatusLabel(sourceId, null),
      "Статус проверяется",
    );
    assert.equal(
      getLoopSettingsSourceStatusLabel(sourceId, []),
      "Нужна настройка сервера",
    );
  }

  for (const sourceId of previewUnavailableSources) {
    assert.equal(
      getLoopSettingsSourceStatusLabel(sourceId),
      "Preview пока не подключён",
    );
  }

  assert.equal(
    getLoopSettingsSourceStatusLabel("company_websites"),
    "Широкий поиск пока не подключён",
  );
  assert.equal(getLoopSettingsSourceStatusLabel("unknown_source", []), null);
});

test("mergeKnownAndSelectedOptions keeps known source chips and never drops a selected one", () => {
  // No selection → exactly the known source options. A loop with no selected
  // sources still renders the full toggle list; nothing extra, nothing thrown.
  assert.deepEqual(
    mergeKnownAndSelectedOptions(DISCOVERY_SOURCE_OPTIONS, []),
    [...DISCOVERY_SOURCE_OPTIONS],
  );

  // Known selections don't duplicate the option rows.
  assert.equal(
    mergeKnownAndSelectedOptions(DISCOVERY_SOURCE_OPTIONS, ["linkedin", "indeed"]).length,
    DISCOVERY_SOURCE_OPTIONS.length,
  );

  // A selected-but-unknown source is appended so it can still be toggled back
  // off — it must not silently vanish from the Sources tab.
  const withCustom = mergeKnownAndSelectedOptions(DISCOVERY_SOURCE_OPTIONS, ["my_custom_board"]);
  assert.equal(withCustom.length, DISCOVERY_SOURCE_OPTIONS.length + 1);
  assert.deepEqual(withCustom[withCustom.length - 1], {
    value: "my_custom_board",
    label: "my_custom_board",
  });
});

test("sortSourcesByPriority orders by product priority and is non-mutating", () => {
  // Legal/easier boards rank before LinkedIn (DISCOVERY_SOURCE_PRIORITY).
  assert.deepEqual(
    sortSourcesByPriority(["linkedin", "arbeitsagentur"]),
    ["arbeitsagentur", "linkedin"],
  );
  // Unknown sources keep their relative order after all known ones.
  assert.deepEqual(
    sortSourcesByPriority(["linkedin", "custom_x", "arbeitsagentur"]),
    ["arbeitsagentur", "linkedin", "custom_x"],
  );
  // Comparison is case-insensitive but the original casing is preserved.
  assert.deepEqual(
    sortSourcesByPriority(["LinkedIn", "Arbeitsagentur"]),
    ["Arbeitsagentur", "LinkedIn"],
  );
  // Input array is not mutated.
  const input = ["linkedin", "arbeitsagentur"];
  sortSourcesByPriority(input);
  assert.deepEqual(input, ["linkedin", "arbeitsagentur"]);
});

test("toggleSettingsValue adds and removes a source without mutating the input", () => {
  const enabled = ["linkedin"];
  assert.deepEqual(toggleSettingsValue(enabled, "indeed"), ["linkedin", "indeed"]);
  assert.deepEqual(toggleSettingsValue(["linkedin", "indeed"], "indeed"), ["linkedin"]);
  // The original array is left untouched.
  assert.deepEqual(enabled, ["linkedin"]);
});
