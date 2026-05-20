import assert from "node:assert/strict";

import {
  ARBEITSAGENTUR_SOURCE_ID,
  collectDiscoveryPreviewMessages,
  DISCOVERY_PREVIEW_COPY,
  getDiscoveryPreviewCopyText,
  getDiscoveryPreviewSaveButtonLabel,
  getDiscoveryWarningMessage,
  isDiscoveryPreviewSaveDisabled,
  isArbeitsagenturSelected,
} from "../discoveryPreview.helpers";

assert.equal(ARBEITSAGENTUR_SOURCE_ID, "arbeitsagentur");
assert.equal(isArbeitsagenturSelected(["manual_url", "arbeitsagentur"]), true);
assert.equal(isArbeitsagenturSelected(["manual_url"]), false);
assert.equal(isArbeitsagenturSelected(undefined), false);

assert.equal(
  getDiscoveryWarningMessage("automatic_discovery_not_available"),
  "Этот источник пока не поддерживает предварительный поиск.",
);
assert.equal(
  getDiscoveryWarningMessage("automatic_match_persistence_not_enabled"),
  "Автоматическое сохранение пока не включено.",
);
assert.equal(
  getDiscoveryWarningMessage("arbeitsagentur_requires_search_terms"),
  "Добавьте профессию или ключевые слова в настройки направления.",
);

const messages = collectDiscoveryPreviewMessages({
  runId: "run-1",
  status: "completed_with_warnings",
  dryRun: true,
  loopsChecked: 1,
  sourcesChecked: 1,
  matchesCreated: 0,
  matchesPreviewed: 0,
  warnings: ["loop-1:arbeitsagentur:automatic_match_persistence_not_enabled"],
  items: [
    {
      loopId: "loop-1",
      sourceId: "arbeitsagentur",
      status: "would_run",
      reason: "adapter_preview_ready",
      message: "ok",
      itemsPreviewed: 0,
      previewItems: [],
      warnings: ["arbeitsagentur_requires_search_terms"],
      errors: [],
    },
  ],
});

assert.equal(messages.includes("Автоматическое сохранение пока не включено."), true);
assert.equal(
  messages.includes("Добавьте профессию или ключевые слова в настройки направления."),
  true,
);

const copy = getDiscoveryPreviewCopyText();
assert.equal(copy.includes("Вакансии не сохраняются автоматически."), true);
assert.equal(copy.includes("Сейчас поддерживается только Arbeitsagentur."), true);
assert.equal(copy.includes("Заявка не создаётся автоматически."), true);
assert.equal(DISCOVERY_PREVIEW_COPY.saveAsMatch, "Сохранить как совпадение");
assert.equal(DISCOVERY_PREVIEW_COPY.savedAsMatch, "Сохранено");
assert.equal(DISCOVERY_PREVIEW_COPY.alreadySaved, "Уже сохранено");
assert.equal(getDiscoveryPreviewSaveButtonLabel("idle"), "Сохранить как совпадение");
assert.equal(getDiscoveryPreviewSaveButtonLabel("saving"), "Сохраняем...");
assert.equal(getDiscoveryPreviewSaveButtonLabel("saved"), "Сохранено");
assert.equal(getDiscoveryPreviewSaveButtonLabel("duplicate"), "Уже сохранено");
assert.equal(isDiscoveryPreviewSaveDisabled("idle"), false);
assert.equal(isDiscoveryPreviewSaveDisabled("saving"), true);
assert.equal(isDiscoveryPreviewSaveDisabled("saved"), true);
assert.equal(isDiscoveryPreviewSaveDisabled("duplicate"), true);

const forbiddenSearchDirectionWords = new RegExp(
  [`ци${"кл"}`, `ци${"клы"}`, `cy${"cle"}`].join("|"),
  "i",
);
assert.equal(forbiddenSearchDirectionWords.test(copy), false);
