/* global RequestInit */

import { auth } from "src/shared/config";

// ── Error type ─────────────────────────────────────────────────────────────────

export interface BackendErrorEnvelope {
  error?: {
    code?: unknown;
    message?: unknown;
    request_id?: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly errorBody?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    options: { requestId?: string; errorBody?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = options.requestId;
    this.errorBody = options.errorBody;
  }
}

// ── Request builder (pure — testable without network or Firebase) ───────────────

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface RestRequestOptions {
  /** Defaults to true. Use false only for explicitly public endpoints, e.g. health. */
  auth?: boolean;
  headers?: Record<string, string>;
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function hasRequestBody(body: unknown): boolean {
  return body !== undefined;
}

function withoutContentType(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => name.toLowerCase() !== "content-type"),
  );
}

/**
 * Build a fetch RequestInit with the Authorization header attached.
 * Exported so tests can verify header construction without mocking fetch.
 */
export function buildAuthedRequest(
  method: HttpMethod,
  token: string,
  body?: unknown,
  options: Omit<RestRequestOptions, "auth"> = {},
): RequestInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!hasRequestBody(body)) {
    return { method, headers };
  }

  if (isFormDataBody(body)) {
    return { method, headers: withoutContentType(headers), body };
  }

  headers["Content-Type"] = "application/json";

  return {
    method,
    headers,
    body: JSON.stringify(body),
  };
}

function buildPublicRequest(
  method: HttpMethod,
  body?: unknown,
  options: Omit<RestRequestOptions, "auth"> = {},
): RequestInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!hasRequestBody(body)) {
    return { method, headers };
  }

  if (isFormDataBody(body)) {
    return { method, headers: withoutContentType(headers), body };
  }

  headers["Content-Type"] = "application/json";

  return {
    method,
    headers,
    body: JSON.stringify(body),
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

type AuthTokenProvider = () => Promise<string>;

async function getFirebaseIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Not authenticated");
  return user.getIdToken();
}

let authTokenProvider: AuthTokenProvider = getFirebaseIdToken;

async function getToken(): Promise<string> {
  return authTokenProvider();
}

/** Override token lookup in focused Node tests without creating a second Firebase app. */
export function _overrideRestAuthTokenProviderForTests(provider: AuthTokenProvider): void {
  authTokenProvider = provider;
}

/** Reset token lookup back to the real Firebase Auth currentUser. */
export function _resetRestAuthTokenProviderForTests(): void {
  authTokenProvider = getFirebaseIdToken;
}

function getHeader(response: Response, name: string): string | undefined {
  return response.headers.get(name) ?? undefined;
}

function readErrorEnvelope(data: unknown): {
  code?: string;
  message?: string;
  requestId?: string;
} {
  const envelope = data as BackendErrorEnvelope | null;
  const error = envelope && typeof envelope === "object" ? envelope.error : undefined;

  if (!error || typeof error !== "object") {
    return {};
  }

  return {
    code: typeof error.code === "string" ? error.code : undefined,
    message: typeof error.message === "string" ? error.message : undefined,
    requestId: typeof error.request_id === "string" ? error.request_id : undefined,
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.toLowerCase().includes("application/json")) {
    return response.json().catch(() => undefined);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? text : undefined;
}

export async function handleResponse<T>(response: Response): Promise<T> {
  const requestIdFromHeader = getHeader(response, "X-Request-ID");
  const data = await readResponseBody(response);

  if (!response.ok) {
    const backendError = readErrorEnvelope(data);
    const requestId = backendError.requestId ?? requestIdFromHeader;
    const code = backendError.code ?? String(response.status);
    const message = backendError.message ?? `HTTP ${response.status}`;

    throw new ApiError(response.status, code, message, {
      requestId,
      errorBody: data,
    });
  }

  return data as T;
}


export interface RestBlobResponse {
  blob: Blob;
  contentType?: string;
  contentDisposition?: string;
  requestId?: string;
}

export async function handleBlobResponse(response: Response): Promise<RestBlobResponse> {
  const requestId = getHeader(response, "X-Request-ID");

  if (!response.ok) {
    await handleResponse<never>(response);
  }

  return {
    blob: await response.blob(),
    contentType: getHeader(response, "Content-Type"),
    contentDisposition: getHeader(response, "Content-Disposition"),
    requestId,
  };
}

async function buildRequest(
  method: HttpMethod,
  body?: unknown,
  options: RestRequestOptions = {},
): Promise<RequestInit> {
  if (options.auth === false) {
    return buildPublicRequest(method, body, options);
  }

  const token = await getToken();
  return buildAuthedRequest(method, token, body, options);
}

// ── Public fetch helpers ───────────────────────────────────────────────────────

export async function restGet<T>(url: string, options?: RestRequestOptions): Promise<T> {
  const response = await fetch(url, await buildRequest("GET", undefined, options));
  return handleResponse<T>(response);
}

export async function restPost<T>(
  url: string,
  body: unknown,
  options?: RestRequestOptions,
): Promise<T> {
  const response = await fetch(url, await buildRequest("POST", body, options));
  return handleResponse<T>(response);
}

export async function restPatch<T>(
  url: string,
  body: unknown,
  options?: RestRequestOptions,
): Promise<T> {
  const response = await fetch(url, await buildRequest("PATCH", body, options));
  return handleResponse<T>(response);
}

export async function restDelete(url: string, options?: RestRequestOptions): Promise<void> {
  const response = await fetch(url, await buildRequest("DELETE", undefined, options));
  await handleResponse<void>(response);
}


export async function restGetBlob(
  url: string,
  options?: RestRequestOptions,
): Promise<RestBlobResponse> {
  const response = await fetch(url, await buildRequest("GET", undefined, options));
  return handleBlobResponse(response);
}
