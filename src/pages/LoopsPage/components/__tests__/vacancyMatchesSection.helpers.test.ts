import assert from "node:assert/strict";

import {
  getApplicationDetailsRoute,
  getConversionCopyText,
  getCreateApplicationButtonLabel,
  getEmptyMatchesText,
  getPersistedConversionFeedback,
  isActionableVacancyMatch,
  VACANCY_MATCH_CONVERSION_COPY,
} from "../vacancyMatchesSection.helpers";

assert.equal(isActionableVacancyMatch({ status: "new" }), true);
assert.equal(isActionableVacancyMatch({ status: "saved" }), true);
assert.equal(isActionableVacancyMatch({ status: "converted" }), false);
assert.equal(isActionableVacancyMatch({ status: "ignored" }), false);

assert.equal(getCreateApplicationButtonLabel(false), "Создать заявку");
assert.equal(getCreateApplicationButtonLabel(true), "Создаём...");
assert.equal(getApplicationDetailsRoute("app/1"), "/dashboard/applications/app%2F1");

assert.deepEqual(getPersistedConversionFeedback({ applicationId: "app-1" }), {
  message: "Заявка уже создана",
  applicationId: "app-1",
});
assert.equal(getPersistedConversionFeedback({ applicationId: null }), null);

const emptyCopy = getEmptyMatchesText();
assert.equal(emptyCopy.includes("Автоматический поиск ещё не подключён."), true);
assert.equal(emptyCopy.includes("Пока откройте источник"), true);

const conversionCopy = getConversionCopyText();
assert.equal(conversionCopy.includes("Создание заявки выполняется только по вашему нажатию."), true);
assert.equal(conversionCopy.includes("Сохранённое совпадение останется"), true);
assert.equal(VACANCY_MATCH_CONVERSION_COPY.openApplication, "Открыть заявку");

const forbiddenSearchDirectionWords = new RegExp(
  [`ци${"кл"}`, `ци${"клы"}`, `cy${"cle"}`].join("|"),
  "i",
);
assert.equal(forbiddenSearchDirectionWords.test(`${emptyCopy} ${conversionCopy}`), false);
