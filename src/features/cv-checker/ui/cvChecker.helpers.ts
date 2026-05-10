import type { atsScoreCvVsJd } from "src/shared/lib/cvScoring";

export type TextTarget = "cv" | "jd";
export type LoadingTarget = TextTarget | "url" | "clipboard";

export type LoadState =
  | { kind: "idle" }
  | { kind: "loading"; which: LoadingTarget }
  | { kind: "error"; message: string }
  | { kind: "info"; message: string };

export type AtsResult = ReturnType<typeof atsScoreCvVsJd>;

export const MIN_ANALYZE_TEXT_LENGTH = 50;
export const MIN_EXTRACTED_PDF_TEXT_LENGTH = 10;
export const INFO_RESET_DELAY_MS = 1200;
export const BOOKMARKLET_INFO_RESET_DELAY_MS = 1800;

const PDF_READ_ERROR_MESSAGE = "Ошибка чтения PDF";
const CLIPBOARD_READ_ERROR_MESSAGE =
  "Не удалось прочитать буфер. Разреши доступ к clipboard или вставь текст вручную.";

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

export function getPdfErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : PDF_READ_ERROR_MESSAGE;
}

export function getClipboardErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : CLIPBOARD_READ_ERROR_MESSAGE;
}

export function getPdfRequiredMessage(): string {
  return "Нужен PDF файл (.pdf).";
}

export function getPdfTextTooShortMessage(): string {
  return "Не удалось извлечь текст из PDF. Если это скан, нужен OCR. Попробуй другой PDF или вставь текст вручную.";
}

export function getClipboardTextTooShortMessage(): string {
  return "Буфер пустой или содержит слишком короткий текст.";
}

export function getClipboardSuccessMessage(textLength: number): string {
  return `Вставлено из буфера: ${textLength} символов.`;
}

export function getJdUrlRequiredMessage(): string {
  return "Вставь ссылку на вакансию.";
}

export function getUrlExtractedMessage(textLength: number): string {
  return `Извлечено по ссылке: ${textLength} символов.`;
}

export function getBookmarkletCopiedMessage(): string {
  return "Bookmarklet скопирован. Создай закладку и вставь этот код в поле URL.";
}

export function getBookmarkletCopyErrorMessage(): string {
  return "Не удалось скопировать bookmarklet. Скопируй его вручную из поля ниже.";
}
