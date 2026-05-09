import type {
  GoogleCalendarConnectionDoc,
  GoogleCalendarConnectionRuntime,
} from "./googleCalendarConnection.runtime";

const DEFAULT_STATE_TTL_MINUTES = 10;

export interface GoogleCalendarOAuthStateDoc {
  createdAt: Date;
  expiresAt: Date;
  loginHint?: string | undefined;
  returnTo: string;
  state: string;
  userId: string;
}

export interface GoogleCalendarOAuthStateRepository {
  consume: (state: string) => Promise<GoogleCalendarOAuthStateDoc | null>;
  save: (state: GoogleCalendarOAuthStateDoc) => Promise<void>;
}

export interface StartGoogleCalendarConnectionOptions {
  loginHint?: string | undefined;
  now?: Date | undefined;
  returnTo: string;
  runtime: Pick<GoogleCalendarConnectionRuntime, "buildAuthorizationUrl">;
  state: string;
  stateRepository: GoogleCalendarOAuthStateRepository;
  stateTtlMinutes?: number | undefined;
  userId: string;
}

export interface StartGoogleCalendarConnectionResult {
  authorizationUrl: string;
  expiresAt: Date;
  state: string;
}

export interface CompleteGoogleCalendarConnectionOptions {
  code?: string | null | undefined;
  error?: string | null | undefined;
  now?: Date | undefined;
  runtime: Pick<GoogleCalendarConnectionRuntime, "connectWithCode">;
  state?: string | null | undefined;
  stateRepository: GoogleCalendarOAuthStateRepository;
}

export interface CompleteGoogleCalendarConnectionResult {
  connection: GoogleCalendarConnectionDoc;
  returnTo: string;
  userId: string;
}

export async function startGoogleCalendarConnection({
  loginHint,
  now = new Date(),
  returnTo,
  runtime,
  state,
  stateRepository,
  stateTtlMinutes = DEFAULT_STATE_TTL_MINUTES,
  userId,
}: StartGoogleCalendarConnectionOptions): Promise<StartGoogleCalendarConnectionResult> {
  const expiresAt = new Date(now.getTime() + stateTtlMinutes * 60 * 1000);
  const stateDoc: GoogleCalendarOAuthStateDoc = {
    createdAt: now,
    expiresAt,
    ...(loginHint ? { loginHint } : {}),
    returnTo,
    state,
    userId,
  };

  await stateRepository.save(stateDoc);

  return {
    authorizationUrl: runtime.buildAuthorizationUrl({
      loginHint,
      state,
    }),
    expiresAt,
    state,
  };
}

export async function completeGoogleCalendarConnection({
  code,
  error,
  now = new Date(),
  runtime,
  state,
  stateRepository,
}: CompleteGoogleCalendarConnectionOptions): Promise<CompleteGoogleCalendarConnectionResult> {
  if (error) {
    throw new Error(`Google Calendar authorization failed: ${error}`);
  }

  if (!code?.trim()) {
    throw new Error("Google Calendar authorization code is missing");
  }

  if (!state?.trim()) {
    throw new Error("Google Calendar OAuth state is missing");
  }

  const stateDoc = await stateRepository.consume(state);
  if (!stateDoc) {
    throw new Error("Google Calendar OAuth state is invalid");
  }

  if (stateDoc.expiresAt.getTime() < now.getTime()) {
    throw new Error("Google Calendar OAuth state has expired");
  }

  const connection = await runtime.connectWithCode({
    code,
    userId: stateDoc.userId,
  });

  return {
    connection,
    returnTo: stateDoc.returnTo,
    userId: stateDoc.userId,
  };
}
