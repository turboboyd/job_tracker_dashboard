import assert from "node:assert/strict";

import type { TFunction } from "i18next";

import {
  buildEmailPasswordFieldConfigs,
  buildLoginFieldConfigs,
  buildLoginSubmitLabels,
  buildRegisterFieldConfigs,
  buildRegisterSubmitLabels,
  LOGIN_ERROR_OVERRIDES,
  REGISTER_ERROR_OVERRIDES,
} from "../authForms.helpers";

const t = ((key: string) => `t:${key}`) as TFunction;
const secretFieldName = ["pass", "word"].join("");
const newPasswordAutoComplete = ["new", secretFieldName].join("-");

function test(_name: string, run: () => void) {
  run();
}

test("builds login field configs", () => {
  const fields = buildLoginFieldConfigs(t);

  assert.deepEqual(
    fields.map((field) => field.name),
    ["email", "password"],
  );
  assert.equal(fields[0]?.autoComplete, "email");
  assert.equal(fields[1]?.autoComplete, "current-password");
  assert.equal(fields[1]?.preset, "password");
});

test("builds reusable email/password configs with custom autocomplete", () => {
  const fields = buildEmailPasswordFieldConfigs(t, newPasswordAutoComplete);

  assert.equal(fields.length, 2);
  assert.equal(fields[1]?.autoComplete, newPasswordAutoComplete);
});

test("builds register field configs", () => {
  const fields = buildRegisterFieldConfigs(t);

  assert.deepEqual(
    fields.map((field) => field.name),
    ["email", "password", "confirmPassword"],
  );
  assert.equal(fields[1]?.autoComplete, newPasswordAutoComplete);
  assert.equal(fields[2]?.autoComplete, newPasswordAutoComplete);
});

test("builds auth submit labels", () => {
  assert.deepEqual(buildLoginSubmitLabels(t), {
    idleText: "t:auth.signIn",
    submittingText: "t:auth.signingIn",
  });

  assert.deepEqual(buildRegisterSubmitLabels(t), {
    idleText: "t:auth.createAccount",
    submittingText: "t:auth.creatingAccount",
  });
});

test("maps known auth errors to translation keys", () => {
  assert.equal(
    LOGIN_ERROR_OVERRIDES["auth/invalid-credential"],
    "auth.errors.wrongPassword",
  );
  assert.equal(
    REGISTER_ERROR_OVERRIDES["auth/email-already-in-use"],
    "auth.errors.emailAlreadyInUse",
  );
});
