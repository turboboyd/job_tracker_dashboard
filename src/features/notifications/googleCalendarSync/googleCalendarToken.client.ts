import { GOOGLE_CALENDAR_EVENTS_SCOPE } from "./googleCalendarOAuth";

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export interface GoogleCalendarAccessToken {
  accessToken: string;
  expiresAt: Date;
  scope?: string | undefined;
  tokenType: string;
}

interface GoogleIdentityTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleTokenClientConfig {
  callback: (response: GoogleIdentityTokenResponse) => void;
  client_id: string;
  prompt?: string;
  scope: string;
}

interface GoogleIdentityServicesApi {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
    };
  };
}

interface RequestGoogleCalendarAccessTokenOptions {
  clientId: string;
  now?: Date | undefined;
  prompt?: "" | "consent" | "none" | "select_account" | undefined;
  scope?: string | undefined;
  tokenClientFactory?: (
    config: GoogleTokenClientConfig,
  ) => Promise<GoogleTokenClient> | GoogleTokenClient;
}

declare global {
  interface Window {
    google?: GoogleIdentityServicesApi | undefined;
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

export async function requestGoogleCalendarAccessToken({
  clientId,
  now = new Date(),
  prompt = "consent",
  scope = GOOGLE_CALENDAR_EVENTS_SCOPE,
  tokenClientFactory = createGoogleTokenClient,
}: RequestGoogleCalendarAccessTokenOptions): Promise<GoogleCalendarAccessToken> {
  if (!clientId.trim()) {
    throw new Error("Google Calendar client id is missing");
  }

  return new Promise((resolve, reject) => {
    // Fire-and-forget: the token resolves/rejects via the callback below; the
    // factory's own promise is intentionally discarded (no behavior change).
    // eslint-disable-next-line sonarjs/void-use -- intentional fire-and-forget; settled via callback
    void Promise.resolve(
      tokenClientFactory({
        callback(response) {
          const token = toGoogleCalendarAccessToken(response, now);
          if (token) {
            resolve(token);
            return;
          }

          reject(new Error(getGoogleTokenErrorMessage(response)));
        },
        client_id: clientId,
        prompt,
        scope,
      }),
    )
      .then((client) => client.requestAccessToken({ prompt }))
      .catch(reject);
  });
}

export async function loadGoogleIdentityServicesScript(
  src = GOOGLE_IDENTITY_SCRIPT_SRC,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Google Identity Services can run only in a browser");
  }

  if (window.google?.accounts?.oauth2?.initTokenClient) return;

  googleIdentityScriptPromise ??= new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => rejectScriptLoad(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = src;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => rejectScriptLoad(), { once: true });
    document.head.appendChild(script);

    function rejectScriptLoad() {
      googleIdentityScriptPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    }
  });

  await googleIdentityScriptPromise;
}

async function createGoogleTokenClient(
  config: GoogleTokenClientConfig,
): Promise<GoogleTokenClient> {
  await loadGoogleIdentityServicesScript();

  const tokenClientFactory = window.google?.accounts?.oauth2?.initTokenClient;
  if (!tokenClientFactory) {
    throw new Error("Google Identity Services token client is unavailable");
  }

  return tokenClientFactory(config);
}

function toGoogleCalendarAccessToken(
  response: GoogleIdentityTokenResponse,
  now: Date,
): GoogleCalendarAccessToken | null {
  if (!response.access_token) return null;

  return {
    accessToken: response.access_token,
    expiresAt: new Date(
      now.getTime() + Math.max(response.expires_in ?? 0, 0) * 1000,
    ),
    ...(response.scope ? { scope: response.scope } : {}),
    tokenType: response.token_type ?? "Bearer",
  };
}

function getGoogleTokenErrorMessage(response: GoogleIdentityTokenResponse): string {
  return (
    response.error_description ??
    response.error ??
    "Google Calendar access token was not granted"
  );
}
