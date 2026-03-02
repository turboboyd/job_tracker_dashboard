import type { TFunction } from "i18next";

import { getErrorMessage } from "src/shared/lib";

interface FirebaseAuthError {
  code?: string;
  message?: string;
}

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

function isFirebaseAuthError(e: unknown): e is FirebaseAuthError {
  return typeof e === "object" && e !== null;
}

function extractAuthCodeFromMessage(message: string): string | null {
  const m = /\((auth\/[a-zA-Z0-9-]+)\)/.exec(message);
  return m?.[1] ?? null;
}

function looksLikeFirebaseMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("firebase") || message.includes("auth/");
}

function mapByCode(
  t: TFunction,
  merged: Record<string, string>,
  code?: string,
): string | null {
  if (!code) return null;
  const key = merged[code];
  return key ? t(key) : null;
}

function mapByMessageCode(
  t: TFunction,
  merged: Record<string, string>,
  message?: string,
): string | null {
  if (!message) return null;
  const extracted = extractAuthCodeFromMessage(message);
  if (!extracted) return null;
  const key = merged[extracted];
  return key ? t(key) : null;
}

function mapNonFirebaseMessage(message?: string): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  if (trimmed.length === 0) return null;
  return looksLikeFirebaseMessage(trimmed) ? null : trimmed;
}

function mapByRawErrorText(e: unknown): string | null {
  const raw = getErrorMessage(e);
  if (raw === "Unknown error") return null;
  return looksLikeFirebaseMessage(raw) ? null : raw;
}

export function mapFirebaseAuthError(
  e: unknown,
  t: TFunction,
  extraCodeToKey: Record<string, string> = {},
  fallbackKey = "auth.errors.generic",
): string {
  const merged = { ...commonAuthCodeToKey, ...extraCodeToKey };

  if (isFirebaseAuthError(e)) {
    const byCode = mapByCode(t, merged, e.code);
    if (byCode) return byCode;

    const byMsgCode = mapByMessageCode(t, merged, e.message);
    if (byMsgCode) return byMsgCode;

    const nonFirebase = mapNonFirebaseMessage(e.message);
    if (nonFirebase) return nonFirebase;
  }

  const raw = mapByRawErrorText(e);
  if (raw) return raw;

  return t(fallbackKey);
}

export function mapGoogleAuthError(e: unknown, t: TFunction): string {
  return mapFirebaseAuthError(
    e,
    t,
    googlePopupCodeToKey,
    "auth.errors.googleGeneric",
  );
}
