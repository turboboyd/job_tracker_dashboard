import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth } from "src/shared/config/firebase/firebase";

import type { AuthError } from "./authTypes";


function toAuthError(e: unknown): AuthError {
  if (typeof e === "object" && e !== null) {
    const err = e as { code?: string; message?: string };
    return {
      code: err.code,
      message: typeof err.message === "string" && err.message.trim().length > 0
        ? err.message
        : "Authentication error",
    };
  }
  return { message: "Authentication error" };
}

export const signInWithGoogle = createAsyncThunk<void, void, { rejectValue: AuthError }>(
  "auth/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      await setPersistence(auth, browserLocalPersistence).catch(() => {
        // ignore
      });

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      return rejectWithValue(toAuthError(e));
    }
  }
);

export const signInWithEmail = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: AuthError }
>("auth/signInWithEmail", async ({ email, password }, { rejectWithValue }) => {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {
      // ignore
    });

    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    return rejectWithValue(toAuthError(e));
  }
});

export const signUpWithEmail = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: AuthError }
>("auth/signUpWithEmail", async ({ email, password }, { rejectWithValue }) => {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {
      // ignore
    });

    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    return rejectWithValue(toAuthError(e));
  }
});

export const signOutThunk = createAsyncThunk<void, void, { rejectValue: AuthError }>(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
    } catch (e) {
      return rejectWithValue(toAuthError(e));
    }
  }
);
