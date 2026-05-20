import assert from "node:assert/strict";

import { ApiError } from "src/shared/api/rest/restClient";

import {
  formatPlanLabel,
  formatQuotaLine,
  formatAnalysisType,
  getAnalysisCopyText,
  getFeatureAvailabilityText,
  isAiQuotaExhausted,
  getVacancyAnalysisErrorMessage,
  VACANCY_ANALYSIS_COPY,
} from "../vacancyAnalysis.helpers";

assert.equal(formatAnalysisType("basic"), "Базовый анализ");
assert.equal(formatAnalysisType("ai"), "AI-анализ");
assert.equal(formatPlanLabel("free"), "Free");
assert.equal(formatPlanLabel("basic"), "Basic");
assert.equal(formatPlanLabel("premium"), "Premium");

assert.equal(
  formatQuotaLine({ label: "AI-анализ", used: 1, limit: 1 }),
  "AI-анализ: 1 / 1 сегодня",
);
assert.equal(
  formatQuotaLine({ label: "Базовый анализ", limit: 10 }),
  "Базовый анализ: до 10 сегодня",
);
assert.equal(
  isAiQuotaExhausted({
    plan: "free",
    basicUsed: 0,
    basicLimit: 10,
    aiUsed: 1,
    aiLimit: 1,
    day: "2026-05-14",
  }),
  true,
);

const freeFeatureText = getFeatureAvailabilityText({
  plan: "free",
  limits: { basicDailyLimit: 10, aiDailyLimit: 1 },
  features: {
    coverLetter: "short_template",
    interviewQuestions: false,
    cvKeywords: true,
    multiMatchComparison: false,
    priority: "normal",
  },
}).join(" ");
assert.equal(freeFeatureText.includes("Полное сопроводительное письмо"), true);
assert.equal(freeFeatureText.includes("Улучшение плана будет добавлено позже"), true);

assert.equal(
  getVacancyAnalysisErrorMessage(
    new ApiError(429, "ANALYSIS_QUOTA_EXCEEDED", "quota exceeded"),
  ),
  "Лимит анализа на сегодня исчерпан.",
);

assert.equal(
  getVacancyAnalysisErrorMessage(
    new ApiError(503, "AI_PROVIDER_UNAVAILABLE", "provider unavailable"),
  ),
  "AI-провайдер сейчас недоступен. Попробуйте позже.",
);

assert.equal(
  getVacancyAnalysisErrorMessage(
    new ApiError(502, "AI_PROVIDER_INVALID_RESPONSE", "invalid provider response"),
  ),
  "AI вернул некорректный ответ. Попробуйте ещё раз.",
);

const copyText = getAnalysisCopyText();
assert.equal(copyText.includes(VACANCY_ANALYSIS_COPY.privacy), true);
assert.equal(copyText.includes("Сильные стороны"), true);
assert.equal(copyText.includes("Ключевые слова для CV"), true);
assert.equal(copyText.includes("Лимит на сегодня"), true);
assert.equal(copyText.includes("План"), true);

const forbiddenSearchDirectionWords = new RegExp(
  [`ци${"кл"}`, `ци${"клы"}`, `cy${"cle"}`].join("|"),
  "i",
);
assert.equal(forbiddenSearchDirectionWords.test(copyText), false);
