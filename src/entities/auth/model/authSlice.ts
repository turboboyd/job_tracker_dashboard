import type {
  ActionReducerMapBuilder,
  AsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import {
  signInWithEmail,
  signInWithGoogle,
  signOutThunk,
  signUpWithEmail,
} from "./authThunks";
import type { AuthError, AuthState, AuthUser } from "./authTypes";

const initialState: AuthState = {
  user: null,
  isAuthReady: false,
  isLoading: false,
  error: null,
};

function addAuthThunkCases<ThunkArg>(
  builder: ActionReducerMapBuilder<AuthState>,
  thunk: AsyncThunk<void, ThunkArg, { rejectValue: AuthError }>,
  fallbackMessage: string,
) {
  builder
    .addCase(thunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state) => {
      state.isLoading = false;
    })
    .addCase(thunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? { message: fallbackMessage };
    });
}

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
    addAuthThunkCases(builder, signInWithGoogle, "Google sign-in failed");
    addAuthThunkCases(builder, signInWithEmail, "Login failed");
    addAuthThunkCases(builder, signUpWithEmail, "Registration failed");
    addAuthThunkCases(builder, signOutThunk, "Logout failed");
  },
});

export const { setUser, setAuthReady, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
