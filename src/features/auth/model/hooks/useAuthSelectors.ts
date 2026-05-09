import { useSelector } from "react-redux";

import {
  selectAuthDisplayName,
  selectAuthEmail,
  selectAuthErrorObject,
  selectAuthLoading,
  selectAuthPhotoURL,
  selectAuthReady,
  selectAuthUser,
  selectIsAuthenticated,
  selectUid,
} from "src/entities/auth/model";

export function useAuthSelectors() {
  return {
    user: useSelector(selectAuthUser),
    userId: useSelector(selectUid),
    isAuthenticated: useSelector(selectIsAuthenticated),
    isAuthReady: useSelector(selectAuthReady),

    displayName: useSelector(selectAuthDisplayName),
    email: useSelector(selectAuthEmail),
    photoURL: useSelector(selectAuthPhotoURL),

    isLoading: useSelector(selectAuthLoading),
    error: useSelector(selectAuthErrorObject),
  };
}
