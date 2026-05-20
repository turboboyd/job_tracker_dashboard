import type { AuthError } from "./authTypes";

const AUTH_ERROR_MESSAGE = "Authentication error";

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return AUTH_ERROR_MESSAGE;
}

export function toAuthError(error: unknown): AuthError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return {
      code: error.code,
      message: getErrorMessage(error),
    };
  }

  return { message: getErrorMessage(error) };
}

async function loadFirebaseAuth() {
  const [firebaseAuth, authModule] = await Promise.all([
    import("firebase/auth"),
    import("src/shared/config/firebase/auth"),
  ]);

  return { ...firebaseAuth, auth: authModule.auth };
}

export async function ensureBrowserLocalPersistence() {
  const { auth, browserLocalPersistence, setPersistence } = await loadFirebaseAuth();

  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    // Persistence may be unavailable in restricted browser contexts.
  }
}

export async function signInWithGoogleFlow() {
  const { GoogleAuthProvider, auth, signInWithPopup } = await loadFirebaseAuth();
  const provider = new GoogleAuthProvider();

  await signInWithPopup(auth, provider);
}

export async function signInWithEmailFlow(email: string, password: string) {
  const { auth, signInWithEmailAndPassword } = await loadFirebaseAuth();

  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmailFlow(email: string, password: string) {
  const { auth, createUserWithEmailAndPassword } = await loadFirebaseAuth();

  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutFlow() {
  const { auth, signOut } = await loadFirebaseAuth();

  await signOut(auth);
}
