export { authReducer, setUser, setAuthReady, clearAuthError } from "./authSlice";

export {
  selectAuth,
  selectAuthUser,
  selectUid,
  selectIsAuthenticated,
  selectAuthReady,
  selectAuthDisplayName,
  selectAuthEmail,
  selectAuthPhotoURL,
  selectAuthLoading,
  selectAuthError,
  selectAuthErrorCode,
  type StateWithAuth,
} from "./authSelectors";

export type { AuthUser, AuthState, AuthError } from "./authTypes";

export { initAuthListener, stopAuthListener } from "./initAuthListener";

export {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutThunk,
} from "./authThunks";

export { useAuthActions, useAuthSelectors } from "./hooks";

export { useAuthRedirect } from "./useAuthRedirect/useAuthRedirect";
