import { connectAuthEmulator, getAuth } from "firebase/auth";

import { firebaseApp } from "./app";

declare const __IS_PROD__: boolean;
declare const __ENV__: {
  USE_FIREBASE_AUTH_EMULATOR?: string;
  FIREBASE_AUTH_EMULATOR_URL?: string;
};

export const auth = getAuth(firebaseApp);

// DEV/QA ONLY. Connect to the local Firebase Auth Emulator so we can log in with
// an emulator user for browser QA. This is forced off in production by buildEnv
// (the flag is emitted as "false" and the URL as "" whenever isProd), and is
// additionally dead-coded by the !__IS_PROD__ guard so the block is tree-shaken
// out of production builds. The connect is synchronous (runs once at module
// evaluation, before any consumer uses `auth`) and intentionally does NOT pass
// disableWarnings, so Firebase's emulator banner stays visible while developing.
if (
  !__IS_PROD__ &&
  __ENV__.USE_FIREBASE_AUTH_EMULATOR === "true" &&
  __ENV__.FIREBASE_AUTH_EMULATOR_URL
) {
  connectAuthEmulator(auth, __ENV__.FIREBASE_AUTH_EMULATOR_URL);
}
