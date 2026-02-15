import type { AuthState } from "./authTypes";

/**
 * Minimal store shape required by auth selectors.
 *
 * This keeps the auth model independent from the app store implementation
 * while still being compatible with a full RootState.
 */
export type StateWithAuth = {
  auth: AuthState;
};

export const selectAuth = (state: StateWithAuth) => state.auth;

export const selectAuthUser = (state: StateWithAuth) => state.auth.user;

export const selectUid = (state: StateWithAuth) => state.auth.user?.uid ?? null;

export const selectIsAuthenticated = (state: StateWithAuth) =>
  Boolean(state.auth.user?.uid);

export const selectAuthReady = (state: StateWithAuth) => state.auth.isAuthReady;

export const selectAuthDisplayName = (state: StateWithAuth) =>
  state.auth.user?.displayName ?? "";

export const selectAuthEmail = (state: StateWithAuth) =>
  state.auth.user?.email ?? "";

export const selectAuthPhotoURL = (state: StateWithAuth) =>
  state.auth.user?.photoURL ?? null;

export const selectAuthLoading = (state: StateWithAuth) => state.auth.isLoading;

export const selectAuthError = (state: StateWithAuth) =>
  state.auth.error?.message ?? null;

export const selectAuthErrorCode = (state: StateWithAuth) =>
  state.auth.error?.code ?? null;
