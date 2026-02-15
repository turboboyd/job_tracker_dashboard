import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  signInWithEmail,
  signInWithGoogle,
  signOutThunk,
  signUpWithEmail,
} from "./authThunks";
import type { AuthState, AuthUser } from "./authTypes";

const initialState: AuthState = {
  user: null,
  isAuthReady: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    setAuthReady(state, action: PayloadAction<boolean>) {
      state.isAuthReady = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GOOGLE
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? { message: "Google sign-in failed" };
      })

      // LOGIN
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? { message: "Login failed" };
      })

      // REGISTER
      .addCase(signUpWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? { message: "Registration failed" };
      })

      // LOGOUT
      .addCase(signOutThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signOutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? { message: "Logout failed" };
      });
  },
});

export const { setUser, setAuthReady, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
