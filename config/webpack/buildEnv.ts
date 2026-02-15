import dotenv from "dotenv";

export function buildEnv(isProd: boolean): Record<string, string> {
  dotenv.config();

  const publicUrl = process.env.PUBLIC_URL ?? "";

  const env = {
    NODE_ENV: isProd ? "production" : "development",
    PUBLIC_URL: publicUrl,

    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? "",
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? "",
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? "",
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",
  };

  return {
    __ENV__: JSON.stringify(env),
    __IS_PROD__: JSON.stringify(isProd),
    __PUBLIC_URL__: JSON.stringify(publicUrl),
  };
}
