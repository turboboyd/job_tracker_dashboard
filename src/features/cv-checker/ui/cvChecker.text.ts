import type { useTranslation } from "react-i18next";

type Translate = ReturnType<typeof useTranslation>["t"];

export interface CvCheckerText {
  analyze: string;
  bookmarkletCopy: string;
  bookmarkletCopiedAction: string;
  bookmarkletCorsHint: string;
  bookmarkletReadingClipboard: string;
  bookmarkletSteps: string[];
  bookmarkletTitle: string;
  confidence: string;
  cvLabel: string;
  cvPlaceholder: string;
  decision: string;
  emptyValue: string;
  extractFromUrl: string;
  extractingFromUrl: string;
  flags: string;
  gaps: string;
  headerSubtitle: string;
  headerTitle: string;
  jdLabel: string;
  jdPlaceholder: string;
  jdUrlPlaceholder: string;
  loadingPdf: string;
  matched: string;
  metrics: {
    experience: string;
    keywords: string;
    penalty: string;
    skills: string;
  };
  noResult: string;
  notReady: string;
  ready: string;
  score: string;
  textLength: string;
  uploadPdf: string;
}

export function createCvCheckerText(t: Translate): CvCheckerText {
  return {
    analyze: t("cvChecker.analyze", "Анализ"),
    bookmarkletCopy: t("cvChecker.bookmarkletCopy", "Скопировать закладку"),
    bookmarkletCopiedAction: t(
      "cvChecker.bookmarkletPaste",
      "Вставить из буфера",
    ),
    bookmarkletCorsHint: t(
      "cvChecker.bookmarkletCorsHint",
      "Если текст не получается извлечь по ссылке, используй закладку для браузера.",
    ),
    bookmarkletReadingClipboard: t(
      "cvChecker.bookmarkletReadingClipboard",
      "Читаю…",
    ),
    bookmarkletSteps: [
      t("cvChecker.bookmarkletStep1", "Скопируй код закладки."),
      t(
        "cvChecker.bookmarkletStep2",
        "Создай закладку в браузере и вставь этот код в поле URL.",
      ),
      t(
        "cvChecker.bookmarkletStep3",
        "Открой вакансию и нажми созданную закладку.",
      ),
      t(
        "cvChecker.bookmarkletStep4",
        "Вернись сюда и нажми «Вставить из буфера».",
      ),
    ],
    bookmarkletTitle: t(
      "cvChecker.bookmarkletTitle",
      "Закладка для браузера",
    ),
    confidence: t("cvChecker.confidence", "Доверие"),
    cvLabel: t("cvChecker.cvLabel", "Резюме (PDF или текст)"),
    cvPlaceholder: t("cvChecker.cvPlaceholder", "Вставь сюда текст резюме..."),
    decision: t("cvChecker.decision", "Решение"),
    emptyValue: t("cvChecker.emptyValue", "—"),
    extractFromUrl: t("cvChecker.extractFromUrl", "Извлечь по ссылке"),
    extractingFromUrl: t("cvChecker.extractingFromUrl", "Извлекаю…"),
    flags: t("cvChecker.flags", "Предупреждения"),
    gaps: t("cvChecker.gaps", "Что улучшить"),
    headerSubtitle: t(
      "cvChecker.subtitle",
      "Загрузи резюме и описание вакансии из PDF, ссылки или закладки. Всё работает прямо в браузере.",
    ),
    headerTitle: t("cvChecker.title", "Проверка резюме"),
    jdLabel: t("cvChecker.jdLabel", "Описание вакансии (PDF, ссылка или текст)"),
    jdPlaceholder: t(
      "cvChecker.jdPlaceholder",
      "Вставь сюда описание вакансии...",
    ),
    jdUrlPlaceholder: t(
      "cvChecker.jdUrlPlaceholder",
      "Ссылка на вакансию",
    ),
    loadingPdf: t("cvChecker.loading", "Загрузка…"),
    metrics: {
      experience: t("cvChecker.metricExperience", "опыт"),
      keywords: t("cvChecker.metricKeywords", "ключевые слова"),
      penalty: t("cvChecker.metricPenalty", "штраф"),
      skills: t("cvChecker.metricSkills", "навыки"),
    },
    matched: t("cvChecker.matched", "Совпавшие навыки"),
    noResult: t(
      "cvChecker.noResult",
      "Результат появится после заполнения резюме и описания вакансии и нажатия кнопки «Анализ».",
    ),
    notReady: t(
      "cvChecker.notReady",
      "Нужны оба текста, минимум по 50 символов.",
    ),
    ready: t("cvChecker.ready", "Готово к анализу."),
    score: t("cvChecker.score", "Оценка ATS"),
    textLength: t("cvChecker.len", "Длина текста"),
    uploadPdf: t("cvChecker.uploadPdf", "Загрузить PDF"),
  };
}
