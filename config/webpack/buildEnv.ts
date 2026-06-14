import dotenv from "dotenv";

export function buildEnv(isProd: boolean): Record<string, string> {
  dotenv.config();

  const publicUrl = process.env.PUBLIC_URL ?? "";

  // DEV/QA ONLY. The Firebase Auth Emulator can only be enabled in a
  // development build. Forcing `!isProd` here guarantees a production bundle
  // never carries the emulator URL or an enabled flag, regardless of the
  // ambient environment.
  const useAuthEmulator =
    !isProd && process.env.USE_FIREBASE_AUTH_EMULATOR === "true";

  const env = {
    NODE_ENV: isProd ? "production" : "development",
    PUBLIC_URL: publicUrl,

    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? "",
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? "",
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? "",
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",

    USE_FIREBASE_AUTH_EMULATOR: useAuthEmulator ? "true" : "false",
    FIREBASE_AUTH_EMULATOR_URL: useAuthEmulator
      ? (process.env.FIREBASE_AUTH_EMULATOR_URL ?? "http://127.0.0.1:9099")
      : "",
  };

  return {
    __ENV__: JSON.stringify(env),
    __IS_PROD__: JSON.stringify(isProd),
    __PUBLIC_URL__: JSON.stringify(publicUrl),
  };
}
