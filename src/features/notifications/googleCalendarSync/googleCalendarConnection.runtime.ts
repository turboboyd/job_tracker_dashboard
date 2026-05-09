import {
  buildGoogleCalendarAuthorizationUrl,
  exchangeGoogleOAuthCode,
  refreshGoogleOAuthAccessToken,
} from "./googleCalendarOAuth";
import type { GoogleCalendarCredentialsResolver } from "./googleCalendarOutbox.runtime";

const DEFAULT_REFRESH_SKEW_MS = 5 * 60 * 1000;
const DEFAULT_CALENDAR_ID = "primary";

export type GoogleCalendarConnectionStatus = "connected" | "revoked";

export interface GoogleCalendarConnectionDoc {
  accessToken: string;
  calendarId: string;
  connectedAt: Date;
  expiresAt: Date;
  refreshToken: string;
  scope?: string | undefined;
  status: GoogleCalendarConnectionStatus;
  tokenType: string;
  updatedAt: Date;
  userId: string;
}

export interface GoogleCalendarConnectionPatch {
  accessToken?: string | undefined;
  calendarId?: string | undefined;
  disconnectedAt?: Date | undefined;
  errorMessage?: string | undefined;
  expiresAt?: Date | undefined;
  refreshToken?: string | undefined;
  scope?: string | undefined;
  status?: GoogleCalendarConnectionStatus | undefined;
  tokenType?: string | undefined;
  updatedAt: Date;
}

export interface GoogleCalendarConnectionRepository {
  get: (userId: string) => Promise<GoogleCalendarConnectionDoc | null>;
  save: (connection: GoogleCalendarConnectionDoc) => Promise<void>;
  update: (
    userId: string,
    patch: GoogleCalendarConnectionPatch,
  ) => Promise<void>;
}

export interface GoogleCalendarConnectionRuntime
  extends GoogleCalendarCredentialsResolver {
  buildAuthorizationUrl: (
    params: GoogleCalendarAuthorizationRequest,
  ) => string;
  connectWithCode: (
    params: GoogleCalendarConnectWithCodeRequest,
  ) => Promise<GoogleCalendarConnectionDoc>;
  disconnect: (userId: string) => Promise<void>;
}

export interface GoogleCalendarAuthorizationRequest {
  loginHint?: string | undefined;
  state: string;
}

export interface GoogleCalendarConnectWithCodeRequest {
  calendarId?: string | undefined;
  code: string;
  userId: string;
}

export interface CreateGoogleCalendarConnectionRuntimeOptions {
  clientId: string;
  clientSecret: string;
  endpoint?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
  now?: (() => Date) | undefined;
  redirectUri: string;
  refreshSkewMs?: number | undefined;
  repository: GoogleCalendarConnectionRepository;
}

export function createGoogleCalendarConnectionRuntime({
  clientId,
  clientSecret,
  endpoint,
  fetchImpl,
  now = () => new Date(),
  redirectUri,
  refreshSkewMs = DEFAULT_REFRESH_SKEW_MS,
  repository,
}: CreateGoogleCalendarConnectionRuntimeOptions): GoogleCalendarConnectionRuntime {
  return {
    buildAuthorizationUrl({ loginHint, state }) {
      return buildGoogleCalendarAuthorizationUrl({
        clientId,
        loginHint,
        redirectUri,
        state,
      });
    },
    async connectWithCode({ calendarId = DEFAULT_CALENDAR_ID, code, userId }) {
      const existing = await repository.get(userId);
      const currentNow = now();
      const tokens = await exchangeGoogleOAuthCode({
        clientId,
        clientSecret,
        code,
        endpoint,
        fetchImpl,
        now: currentNow,
        redirectUri,
      });
      const refreshToken = tokens.refreshToken ?? existing?.refreshToken;

      if (!refreshToken) {
        throw new Error("Google OAuth response did not include a refresh token");
      }

      const connectedAt = existing?.connectedAt ?? currentNow;
      const connection: GoogleCalendarConnectionDoc = {
        accessToken: tokens.accessToken,
        calendarId,
        connectedAt,
        expiresAt: tokens.expiresAt,
        refreshToken,
        ...buildScopePatch(tokens.scope, existing?.scope),
        status: "connected",
        tokenType: tokens.tokenType,
        updatedAt: currentNow,
        userId,
      };

      await repository.save(connection);
      return connection;
    },
    async disconnect(userId) {
      const currentNow = now();

      await repository.update(userId, {
        disconnectedAt: currentNow,
        status: "revoked",
        updatedAt: currentNow,
      });
    },
    async resolve(userId) {
      const connection = await repository.get(userId);
      if (connection?.status !== "connected") return null;

      const currentNow = now();

      if (!shouldRefresh(connection.expiresAt, currentNow, refreshSkewMs)) {
        return {
          accessToken: connection.accessToken,
          calendarId: connection.calendarId,
        };
      }

      const tokens = await refreshGoogleOAuthAccessToken({
        clientId,
        clientSecret,
        endpoint,
        fetchImpl,
        now: currentNow,
        refreshToken: connection.refreshToken,
      });
      await repository.update(userId, {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        ...(tokens.scope ? { scope: tokens.scope } : {}),
        tokenType: tokens.tokenType,
        updatedAt: currentNow,
      });

      return {
        accessToken: tokens.accessToken,
        calendarId: connection.calendarId,
      };
    },
  };
}

function shouldRefresh(
  expiresAt: Date,
  now: Date,
  refreshSkewMs: number,
): boolean {
  return expiresAt.getTime() - now.getTime() <= refreshSkewMs;
}

function buildScopePatch(
  nextScope: string | undefined,
  existingScope: string | undefined,
): { scope?: string } {
  if (nextScope) return { scope: nextScope };
  if (existingScope) return { scope: existingScope };

  return {};
}
