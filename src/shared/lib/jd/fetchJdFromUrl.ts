import { extractReadableText } from "./extractReadableText";

export type FetchJdResult =
  | { ok: true; text: string; source: "url" }
  | {
      ok: false;
      reason: "CORS_OR_BLOCKED" | "NETWORK" | "NOT_HTML" | "TOO_SHORT";
      message: string;
    };

function isProbablyHtml(contentType: string | null): boolean {
  if (!contentType) return true;

  return (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  );
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export async function fetchJdFromUrl(url: string): Promise<FetchJdResult> {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return { ok: false, reason: "NETWORK", message: "Пустая ссылка." };
  }

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      mode: "cors",
      redirect: "follow",
      credentials: "omit",
    });

    const contentType = response.headers.get("content-type");
    if (!isProbablyHtml(contentType)) {
      return {
        ok: false,
        reason: "NOT_HTML",
        message: `Сайт вернул не HTML (${contentType ?? "unknown"}).`,
      };
    }

    const html = await response.text();
    const text = extractReadableText(html);

    if (!text || text.length < 200) {
      return {
        ok: false,
        reason: "TOO_SHORT",
        message:
          "Текст получился слишком коротким. Возможно, сайт заблокировал доступ или контент догружается скриптами. Попробуй bookmarklet.",
      };
    }

    return { ok: true, text, source: "url" };
  } catch (error: unknown) {
    const message = getUnknownErrorMessage(error, "Failed to fetch");
    const isCorsLikeError = /failed to fetch|cors|blocked|networkerror/i.test(
      message,
    );

    return {
      ok: false,
      reason: isCorsLikeError ? "CORS_OR_BLOCKED" : "NETWORK",
      message: isCorsLikeError
        ? "Браузер заблокировал загрузку страницы (CORS). Попробуй bookmarklet — он работает прямо на странице вакансии."
        : `Ошибка сети: ${message}`,
    };
  }
}
