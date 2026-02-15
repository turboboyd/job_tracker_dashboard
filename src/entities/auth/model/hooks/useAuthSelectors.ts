import { useAppSelector } from "src/app/store/hooks";

import {
  selectAuthDisplayName,
  selectAuthEmail,
  selectAuthError,
  selectAuthLoading,
  selectAuthPhotoURL,
  selectAuthReady,
  selectAuthUser,
  selectIsAuthenticated,
  selectUid,
} from "../authSelectors";

export function useAuthSelectors() {
  return {
    user: useAppSelector(selectAuthUser),
    userId: useAppSelector(selectUid),
    isAuthenticated: useAppSelector(selectIsAuthenticated),
    isAuthReady: useAppSelector(selectAuthReady),

    displayName: useAppSelector(selectAuthDisplayName),
    email: useAppSelector(selectAuthEmail),
    photoURL: useAppSelector(selectAuthPhotoURL),

    isLoading: useAppSelector(selectAuthLoading),
    error: useAppSelector(selectAuthError),
  };
}
