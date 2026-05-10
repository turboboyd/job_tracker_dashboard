import assert from "node:assert/strict";

import type { TFunction } from "i18next";

import {
  mapFirebaseAuthError,
  mapGoogleAuthError,
} from "../firebaseAuthErrors";

const t = ((key: string) => `t:${key}`) as TFunction;

function test(_name: string, run: () => void) {
  run();
}

test("maps common Firebase auth codes", () => {
  assert.equal(
    mapFirebaseAuthError({ code: "auth/invalid-email" }, t),
    "t:auth.errors.invalidEmail",
  );
});

test("extracts Firebase auth codes from messages", () => {
  assert.equal(
    mapFirebaseAuthError(
      { message: "Firebase: Error (auth/too-many-requests)." },
      t,
    ),
    "t:auth.errors.tooManyRequests",
  );
});

test("uses feature-specific error overrides before fallback", () => {
  assert.equal(
    mapFirebaseAuthError(
      { code: "auth/custom-code" },
      t,
      { "auth/custom-code": "auth.errors.custom" },
    ),
    "t:auth.errors.custom",
  );
});

test("keeps readable non-Firebase backend messages", () => {
  assert.equal(
    mapFirebaseAuthError({ message: "Readable backend message" }, t),
    "Readable backend message",
  );
});

test("falls back for unknown Firebase messages", () => {
  assert.equal(
    mapFirebaseAuthError({ message: "Firebase: Error (auth/unknown)." }, t),
    "t:auth.errors.generic",
  );
});

test("maps Google popup auth errors", () => {
  assert.equal(
    mapGoogleAuthError({ code: "auth/popup-closed-by-user" }, t),
    "t:auth.errors.popupClosedByUser",
  );
});
