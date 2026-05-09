export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface GoogleCalendarAuthorizationUrlParams {
  clientId: string;
  loginHint?: string | undefined;
  prompt?: "consent" | "none" | "select_account" | undefined;
  redirectUri: string;
  scope?: string | undefined;
  state: string;
}

export interface GoogleOAuthTokenRequestConfig {
  clientId: string;
  clientSecret: string;
  endpoint?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
  now?: Date | undefined;
}

export interface ExchangeGoogleOAuthCodeParams
  extends GoogleOAuthTokenRequestConfig {
  code: string;
  redirectUri: string;
}

export interface RefreshGoogleOAuthAccessTokenParams
  extends GoogleOAuthTokenRequestConfig {
  refreshToken: string;
}

export interface GoogleOAuthTokens {
  accessToken: string;
  expiresAt: Date;
  refreshToken?: string | undefined;
  scope?: string | undefined;
  tokenType: string;
}

interface GoogleOAuthTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

export function buildGoogleCalendarAuthorizationUrl({
  clientId,
  loginHint,
  prompt = "consent",
  redirectUri,
  scope = GOOGLE_CALENDAR_EVENTS_SCOPE,
  state,
}: GoogleCalendarAuthorizationUrlParams): string {
  const url = new URL(GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("include_granted_scopes", "true");
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  url.searchParams.set("prompt", prompt);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeGoogleOAuthCode({
  clientId,
  clientSecret,
  code,
  endpoint = GOOGLE_OAUTH_TOKEN_ENDPOINT,
  fetchImpl = fetch,
  now = new Date(),
  redirectUri,
}: ExchangeGoogleOAuthCodeParams): Promise<GoogleOAuthTokens> {
  return requestGoogleOAuthTokens({
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    },
    endpoint,
    fetchImpl,
    now,
  });
}

export async function refreshGoogleOAuthAccessToken({
  clientId,
  clientSecret,
  endpoint = GOOGLE_OAUTH_TOKEN_ENDPOINT,
  fetchImpl = fetch,
  now = new Date(),
  refreshToken,
}: RefreshGoogleOAuthAccessTokenParams): Promise<GoogleOAuthTokens> {
  return requestGoogleOAuthTokens({
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    endpoint,
    fetchImpl,
    now,
  });
}

async function requestGoogleOAuthTokens({
  body,
  endpoint,
  fetchImpl,
  now,
}: {
  body: Record<string, string>;
  endpoint: string;
  fetchImpl: typeof fetch;
  now: Date;
}): Promise<GoogleOAuthTokens> {
  const response = await fetchImpl(endpoint, {
    body: new URLSearchParams(body).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const data = await readTokenResponse(response);

  if (!response.ok) {
    throw new Error(buildTokenErrorMessage(response.status, data));
  }

  if (!data.access_token) {
    throw new Error("Google OAuth token response did not include an access token");
  }

  return {
    accessToken: data.access_token,
    expiresAt: new Date(now.getTime() + Math.max(data.expires_in ?? 0, 0) * 1000),
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    ...(data.scope ? { scope: data.scope } : {}),
    tokenType: data.token_type ?? "Bearer",
  };
}

async function readTokenResponse(
  response: Response,
): Promise<GoogleOAuthTokenResponse> {
  const parsed: unknown = await response.json().catch(() => ({}));
  if (!isRecord(parsed)) return {};

  return compactUndefinedRecord({
    access_token: toOptionalString(parsed.access_token),
    error: toOptionalString(parsed.error),
    error_description: toOptionalString(parsed.error_description),
    expires_in: toOptionalNumber(parsed.expires_in),
    refresh_token: toOptionalString(parsed.refresh_token),
    scope: toOptionalString(parsed.scope),
    token_type: toOptionalString(parsed.token_type),
  }) as GoogleOAuthTokenResponse;
}

function buildTokenErrorMessage(
  status: number,
  data: GoogleOAuthTokenResponse,
): string {
  const details = data.error_description ?? data.error ?? "Unknown OAuth error";

  return `Google OAuth token request failed: ${status} ${details}`;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function compactUndefinedRecord(value: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
