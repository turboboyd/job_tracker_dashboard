import { useCallback } from "react";

import { useAppDispatch } from "src/app/store/hooks";

import { clearAuthError } from "../authSlice";
import {
  signInWithEmail,
  signInWithGoogle,
  signOutThunk,
  signUpWithEmail,
} from "../authThunks";

export function useAuthActions() {
  const dispatch = useAppDispatch();

  const signInGoogle = useCallback(async () => {
    await dispatch(signInWithGoogle()).unwrap();
  }, [dispatch]);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      await dispatch(signInWithEmail({ email, password })).unwrap();
    },
    [dispatch],
  );

  const signUpEmail = useCallback(
    async (email: string, password: string) => {
      await dispatch(signUpWithEmail({ email, password })).unwrap();
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    await dispatch(signOutThunk()).unwrap();
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return {
    signInWithGoogle: signInGoogle,
    signInWithEmail: signInEmail,
    signUpWithEmail: signUpEmail,
    signOut,
    clearAuthError: clearError,
  };
}
