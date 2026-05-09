import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  ensureBrowserLocalPersistence,
  signInWithEmailFlow,
  signInWithGoogleFlow,
  signOutFlow,
  signUpWithEmailFlow,
  toAuthError,
} from "./authThunks.helpers";
import type { AuthError } from "./authTypes";

interface AuthThunkConfig {
  rejectValue: AuthError;
}

export const signInWithGoogle = createAsyncThunk<void, void, AuthThunkConfig>(
  "auth/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      await ensureBrowserLocalPersistence();
      await signInWithGoogleFlow();
    } catch (error) {
      return rejectWithValue(toAuthError(error));
    }
  },
);

export const signInWithEmail = createAsyncThunk<
  void,
  { email: string; password: string },
  AuthThunkConfig
>("auth/signInWithEmail", async ({ email, password }, { rejectWithValue }) => {
  try {
    await ensureBrowserLocalPersistence();
    await signInWithEmailFlow(email, password);
  } catch (error) {
    return rejectWithValue(toAuthError(error));
  }
});

export const signUpWithEmail = createAsyncThunk<
  void,
  { email: string; password: string },
  AuthThunkConfig
>("auth/signUpWithEmail", async ({ email, password }, { rejectWithValue }) => {
  try {
    await ensureBrowserLocalPersistence();
    await signUpWithEmailFlow(email, password);
  } catch (error) {
    return rejectWithValue(toAuthError(error));
  }
});

export const signOutThunk = createAsyncThunk<void, void, AuthThunkConfig>(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await signOutFlow();
    } catch (error) {
      return rejectWithValue(toAuthError(error));
    }
  },
);
