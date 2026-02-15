import type { TFunction } from "i18next";

import { getErrorMessage } from "src/shared/lib";

type FirebaseAuthError = {
  code?: string;
  message?: string;
};

const commonAuthCodeToKey: Record<string, string> = {
  "auth/invalid-email": "auth.errors.invalidEmail",
  "auth/too-many-requests": "auth.errors.tooManyRequests",
  "auth/network-request-failed": "auth.errors.network",
  "auth/operation-not-allowed": "auth.errors.operationNotAllowed",
};

const googlePopupCodeToKey: Record<string, string> = {
  "auth/popup-closed-by-user": "auth.errors.popupClosedByUser",
  "auth/cancelled-popup-request": "auth.errors.cancelledPopupRequest",
  "auth/popup-blocked": "auth.errors.popupBlocked",
};

export function mapFirebaseAuthError(
  e: unknown,
  t: TFunction,
  extraCodeToKey: Record<string, string> = {},
  fallbackKey: string = "auth.errors.generic",
): string {
  if (typeof e === "object" && e !== null) {
    const err = e as FirebaseAuthError;

    const merged = { ...commonAuthCodeToKey, ...extraCodeToKey };
    if (err.code && merged[err.code]) return t(merged[err.code]);

    if (typeof err.message === "string" && err.message.trim().length > 0) {
      return err.message;
    }
  }

  const raw = getErrorMessage(e);
  if (raw !== "Unknown error") return raw;

  return t(fallbackKey);
}

export function mapGoogleAuthError(e: unknown, t: TFunction): string {
  return mapFirebaseAuthError(e, t, googlePopupCodeToKey, "auth.errors.googleGeneric");
}
