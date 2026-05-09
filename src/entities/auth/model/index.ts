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
  selectAuthErrorObject,
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
