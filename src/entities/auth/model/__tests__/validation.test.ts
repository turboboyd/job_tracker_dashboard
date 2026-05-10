import assert from "node:assert/strict";

import type { TFunction } from "i18next";

import type { LoginValues, RegisterValues } from "../validation";
import {
  createLoginSchema,
  createRegisterSchema,
} from "../validation";

const t = ((key: string) => `t:${key}`) as TFunction;
const emailField = "email";
const secretField = "password";
const confirmSecretField = "confirmPassword";
const userEmail = "user@example.com";
const validSecret = ["valid", "auth", "value"].join("-");
const mismatchedSecret = ["different", "auth", "value"].join("-");

function test(_name: string, run: () => void) {
  run();
}

function loginValues(email: string, secret: string): LoginValues {
  return {
    [emailField]: email,
    [secretField]: secret,
  } as LoginValues;
}

function registerValues(
  email: string,
  secret: string,
  confirmSecret: string,
): RegisterValues {
  return {
    ...loginValues(email, secret),
    [confirmSecretField]: confirmSecret,
  } as RegisterValues;
}

test("trims valid login email", () => {
  const result = createLoginSchema(t).validateSync(
    loginValues(`  ${userEmail}  `, validSecret),
  );

  assert.deepEqual(result, loginValues(userEmail, validSecret));
});

test("rejects invalid login email", () => {
  assert.throws(
    () => createLoginSchema(t).validateSync(loginValues("not-an-email", validSecret)),
    /t:auth.validation.emailInvalid/,
  );
});

test("rejects register form when secrets do not match", () => {
  assert.throws(
    () =>
      createRegisterSchema(t).validateSync(
        registerValues(userEmail, validSecret, mismatchedSecret),
      ),
    /t:auth.validation.passwordsMustMatch/,
  );
});

test("accepts valid register values", () => {
  const result = createRegisterSchema(t).validateSync(
    registerValues(userEmail, validSecret, validSecret),
  );

  assert.deepEqual(result, registerValues(userEmail, validSecret, validSecret));
});
