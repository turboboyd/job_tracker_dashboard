import {
  completeGoogleCalendarConnection,
  startGoogleCalendarConnection,
  type GoogleCalendarOAuthStateRepository,
} from "./googleCalendarConnection.handlers";
import type { GoogleCalendarConnectionRuntime } from "./googleCalendarConnection.runtime";

const DEFAULT_RETURN_TO = "/settings/notifications";

export type GoogleCalendarHttpQueryValue =
  | readonly string[]
  | string
  | undefined;

export interface GoogleCalendarHttpRequest {
  authenticatedUserId?: string | undefined;
  query: Record<string, GoogleCalendarHttpQueryValue>;
}

export interface GoogleCalendarHttpResult {
  body?: string | undefined;
  headers?: Record<string, string> | undefined;
  status: number;
}

export interface HandleGoogleCalendarConnectRequestOptions {
  defaultReturnTo?: string | undefined;
  now?: Date | undefined;
  request: GoogleCalendarHttpRequest;
  runtime: Pick<GoogleCalendarConnectionRuntime, "buildAuthorizationUrl">;
  stateFactory?: (() => string) | undefined;
  stateRepository: GoogleCalendarOAuthStateRepository;
}

export interface HandleGoogleCalendarCallbackRequestOptions {
  now?: Date | undefined;
  request: GoogleCalendarHttpRequest;
  runtime: Pick<GoogleCalendarConnectionRuntime, "connectWithCode">;
  stateRepository: GoogleCalendarOAuthStateRepository;
}

export async function handleGoogleCalendarConnectRequest({
  defaultReturnTo = DEFAULT_RETURN_TO,
  now = new Date(),
  request,
  runtime,
  stateFactory = createGoogleCalendarOAuthState,
  stateRepository,
}: HandleGoogleCalendarConnectRequestOptions): Promise<GoogleCalendarHttpResult> {
  const userId = resolveRequestUserId(request);
  if (!userId) {
    return badRequest("Google Calendar connection requires an authenticated user");
  }

  const returnTo = normalizeGoogleCalendarReturnTo(
    getQueryString(request.query.returnTo),
    defaultReturnTo,
  );
  const state = stateFactory();
  const result = await startGoogleCalendarConnection({
    loginHint: getQueryString(request.query.loginHint),
    now,
    returnTo,
    runtime,
    state,
    stateRepository,
    userId,
  });

  return redirect(result.authorizationUrl);
}

export async function handleGoogleCalendarCallbackRequest({
  now = new Date(),
  request,
  runtime,
  stateRepository,
}: HandleGoogleCalendarCallbackRequestOptions): Promise<GoogleCalendarHttpResult> {
  const result = await completeGoogleCalendarConnection({
    code: getQueryString(request.query.code),
    error: getQueryString(request.query.error),
    now,
    runtime,
    state: getQueryString(request.query.state),
    stateRepository,
  });

  return redirect(
    appendGoogleCalendarConnectionStatus(result.returnTo, "connected"),
  );
}

export function createGoogleCalendarOAuthState(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  throw new Error("Secure Google Calendar OAuth state generator is unavailable");
}

export function normalizeGoogleCalendarReturnTo(
  value: string | undefined,
  fallback = DEFAULT_RETURN_TO,
): string {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function appendGoogleCalendarConnectionStatus(
  returnTo: string,
  status: "connected",
): string {
  const url = new URL(returnTo, "https://job-tracker.local");
  url.searchParams.set("googleCalendar", status);

  return `${url.pathname}${url.search}${url.hash}`;
}

function resolveRequestUserId(
  request: GoogleCalendarHttpRequest,
): string | null {
  const requestedUserId = getQueryString(request.query.uid);
  const authenticatedUserId = request.authenticatedUserId?.trim();

  if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
    return null;
  }

  return authenticatedUserId ?? requestedUserId ?? null;
}

function redirect(location: string): GoogleCalendarHttpResult {
  return {
    headers: {
      Location: location,
    },
    status: 302,
  };
}

function badRequest(body: string): GoogleCalendarHttpResult {
  return {
    body,
    status: 400,
  };
}

function getQueryString(value: GoogleCalendarHttpQueryValue): string | undefined {
  if (typeof value === "string") return value;
  if (isQueryStringArray(value)) return value[0];

  return undefined;
}

function isQueryStringArray(
  value: GoogleCalendarHttpQueryValue,
): value is readonly string[] {
  return Array.isArray(value);
}
