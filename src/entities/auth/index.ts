export { guardAuthRtk } from "./lib/guardAuthRtk";
export { requireUidFromState } from "./lib/requireUidFromState";

export { selectAuthErrorObject } from "./model/authSelectors";

export {
  createLoginSchema,
  createRegisterSchema,
  type LoginValues,
  type RegisterValues,
} from "./model/validation";

export {
  authReducer,
  setUser,
  setAuthReady,
  clearAuthError,
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

  initAuthListener,
  stopAuthListener,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutThunk,
  type AuthUser,
  type AuthState,
  type AuthError,
  type StateWithAuth,
} from "./model";
