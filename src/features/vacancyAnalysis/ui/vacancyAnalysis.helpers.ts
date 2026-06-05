import { ApiError } from "src/shared/api/rest/restClient";

import type { AnalysisPlan, VacancyAnalysis, VacancyAnalysisPlan, VacancyAnalysisQuota } from "../rest/types";

export const VACANCY_ANALYSIS_COPY = {
  action: "Анализ с резюме",
  emptyTitle: "Пока анализа нет.",
  emptyBody: "Вставьте текст резюме, и система оценит, насколько вакансия подходит.",
  privacy: "Текст резюме используется только для анализа и не сохраняется.",
  basicLabel: "Базовый анализ",
  basicDescription: "Базовый анализ — быстрый анализ по ключевым словам и правилам.",
  aiLabel: "AI-анализ",
  aiDescription: "AI-анализ — более подробный анализ, расходует дневной AI-лимит.",
  aiUnavailableNote: "AI-анализ ещё не настроен на сервере — доступен базовый анализ.",
  resumeLabel: "Текст резюме",
  resumePlaceholder: "Вставьте текст резюме или CV...",
  resumeProfileHint: "Резюме подставлено из профиля — измените текст при необходимости.",
  resumeProfileFallbackHint: "Поле пустое — будет использовано резюме из профиля.",
  historySaved: "История анализа сохраняется.",
  score: "Оценка",
  strengths: "Сильные стороны",
  gaps: "Пробелы",
  risks: "Риски",
  cvKeywords: "Ключевые слова для CV",
  applicationAngle: "Фокус отклика",
  coverLetter: "Сопроводительное письмо",
  interviewQuestions: "Вопросы для интервью",
  quotaToday: "Лимит на сегодня",
  plan: "План",
  usageUpdatesAfterAnalysis: "Использование обновится после анализа.",
  fullFeaturesLocked: "Полное сопроводительное письмо и вопросы для интервью доступны в платных планах.",
  freePlanHint: "Сейчас доступен короткий шаблон и базовый анализ.",
  upgradeLater: "Улучшение плана будет добавлено позже.",
  featureCoverLetter: "Сопроводительное письмо",
  featureInterviewQuestions: "Вопросы для интервью",
  featureCvKeywords: "Ключевые слова для CV",
  featureComparison: "Сравнение нескольких вакансий",
  featurePriority: "Приоритетный анализ",
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  ANALYSIS_QUOTA_EXCEEDED: "Лимит анализа на сегодня исчерпан.",
  ANALYSIS_FEATURE_UNAVAILABLE: "Эта функция недоступна на вашем текущем плане.",
  AI_PROVIDER_UNAVAILABLE: "AI-провайдер сейчас недоступен. Попробуйте позже.",
  AI_PROVIDER_INVALID_RESPONSE: "AI вернул некорректный ответ. Попробуйте ещё раз.",
  AI_PROVIDER_TIMEOUT: "AI-анализ занял слишком много времени. Попробуйте позже.",
  AI_PROVIDER_NOT_CONFIGURED: "AI-анализ ещё не настроен на сервере.",
  ANALYSIS_RESUME_REQUIRED: "Добавьте резюме в профиле или вставьте его текст для анализа.",
};

export function getVacancyAnalysisErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? "Не удалось выполнить анализ. Попробуйте ещё раз.";
  }
  return "Не удалось выполнить анализ. Попробуйте ещё раз.";
}

export function formatAnalysisType(type: VacancyAnalysis["analysisType"]): string {
  return type === "ai" ? VACANCY_ANALYSIS_COPY.aiLabel : VACANCY_ANALYSIS_COPY.basicLabel;
}

export function formatPlanLabel(plan: VacancyAnalysisPlan): string {
  if (plan === "premium") return "Premium";
  if (plan === "basic") return "Basic";
  return "Free";
}

export function formatQuota(analysis: VacancyAnalysis): string | null {
  const quota = analysis.quota;
  if (!quota) return null;

  return [
    `${VACANCY_ANALYSIS_COPY.quotaToday}:`,
    `${quota.basicUsed}/${quota.basicLimit} базовых`,
    `${quota.aiUsed}/${quota.aiLimit} AI`,
  ].join(" ");
}

export function formatQuotaLine(args: {
  label: string;
  used?: number;
  limit: number;
}): string {
  if (args.used === undefined) {
    return `${args.label}: до ${args.limit} сегодня`;
  }
  return `${args.label}: ${args.used} / ${args.limit} сегодня`;
}

export function isAiQuotaExhausted(quota?: VacancyAnalysisQuota | null): boolean {
  return Boolean(quota && quota.aiUsed >= quota.aiLimit);
}

export function getFeatureAvailabilityText(plan: AnalysisPlan | null): string[] {
  if (!plan) return [VACANCY_ANALYSIS_COPY.usageUpdatesAfterAnalysis];
  if (plan.plan === "free") {
    return [
      VACANCY_ANALYSIS_COPY.fullFeaturesLocked,
      VACANCY_ANALYSIS_COPY.freePlanHint,
      VACANCY_ANALYSIS_COPY.upgradeLater,
    ];
  }

  const available = [
    VACANCY_ANALYSIS_COPY.featureCvKeywords,
    plan.features.coverLetter === "enabled" ? VACANCY_ANALYSIS_COPY.featureCoverLetter : "",
    plan.features.interviewQuestions ? VACANCY_ANALYSIS_COPY.featureInterviewQuestions : "",
    plan.features.multiMatchComparison ? VACANCY_ANALYSIS_COPY.featureComparison : "",
    plan.features.priority === "high" ? VACANCY_ANALYSIS_COPY.featurePriority : "",
  ].filter(Boolean);

  return [`Доступно: ${available.join(", ")}.`];
}

export function getAnalysisCopyText(): string {
  return Object.values(VACANCY_ANALYSIS_COPY).join(" ");
}
