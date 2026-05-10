import { getAuth } from "firebase/auth";

// ── Error type ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// ── Request builder (pure — testable without network or Firebase) ───────────────

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Build a fetch RequestInit with the Authorization header attached.
 * Exported so tests can verify header construction without mocking fetch.
 */
export function buildAuthedRequest(
  method: HttpMethod,
  token: string,
  body?: unknown,
): RequestInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  return {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Not authenticated");
  return user.getIdToken();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    const detail = (data as Record<string, unknown> | null)?.["detail"];
    const message =
      typeof detail === "string"
        ? detail
        : ((data as Record<string, unknown> | null)?.["error"] as Record<string, unknown> | undefined)?.["message"] as string | undefined ??
          `HTTP ${response.status}`;
    throw new ApiError(response.status, String(response.status), message);
  }

  return data as T;
}

// ── Public fetch helpers ───────────────────────────────────────────────────────

export async function restGet<T>(url: string): Promise<T> {
  const token = await getToken();
  const response = await fetch(url, buildAuthedRequest("GET", token));
  return handleResponse<T>(response);
}

export async function restPost<T>(url: string, body: unknown): Promise<T> {
  const token = await getToken();
  const response = await fetch(url, buildAuthedRequest("POST", token, body));
  return handleResponse<T>(response);
}

export async function restPatch<T>(url: string, body: unknown): Promise<T> {
  const token = await getToken();
  const response = await fetch(url, buildAuthedRequest("PATCH", token, body));
  return handleResponse<T>(response);
}

export async function restDelete(url: string): Promise<void> {
  const token = await getToken();
  const response = await fetch(url, buildAuthedRequest("DELETE", token));
  await handleResponse<void>(response);
}
