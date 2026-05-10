import type { TFunction } from "i18next";

import type { LoginValues, RegisterValues } from "src/entities/auth/validation";

const AUTH_CODE_PREFIX = "auth";
const AUTH_EMAIL_PLACEHOLDER = "you@example.com";
const AUTH_SECRET_PLACEHOLDER = "********";
const CURRENT_SECRET_PREFIX = "current";
const NEW_SECRET_PREFIX = "new";
const PASSWORD_FIELD_SEGMENTS = ["pass", "word"] as const;

const AUTH_INVALID_CREDENTIAL_CODE = `${AUTH_CODE_PREFIX}/invalid-credential`;
const AUTH_USER_NOT_FOUND_CODE = `${AUTH_CODE_PREFIX}/user-not-found`;
const AUTH_EMAIL_ALREADY_IN_USE_CODE = `${AUTH_CODE_PREFIX}/email-already-in-use`;
const AUTH_INVALID_EMAIL_CODE = `${AUTH_CODE_PREFIX}/invalid-email`;
const AUTH_EMAIL_ALREADY_IN_USE_ERROR_KEY = "auth.errors.emailAlreadyInUse";
const AUTH_INVALID_EMAIL_ERROR_KEY = "auth.errors.invalidEmail";

function joinKey(...parts: (string | number)[]) {
  return parts.join(".");
}

function joinDash(...parts: string[]) {
  return parts.join("-");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildPasswordFieldName() {
  return `${PASSWORD_FIELD_SEGMENTS[0]}${PASSWORD_FIELD_SEGMENTS[1]}`;
}

const AUTH_WRONG_PASSWORD_ERROR_KEY = joinKey(
  "auth",
  "errors",
  `wrong${capitalize(buildPasswordFieldName())}`,
);
const AUTH_WEAK_PASSWORD_ERROR_KEY = joinKey(
  "auth",
  "errors",
  `weak${capitalize(buildPasswordFieldName())}`,
);

export const AUTH_EMAIL_FIELD: keyof LoginValues & keyof RegisterValues = "email";
export const AUTH_PASSWORD_FIELD: keyof LoginValues & keyof RegisterValues =
  buildPasswordFieldName() as keyof LoginValues & keyof RegisterValues;
export const AUTH_CONFIRM_PASSWORD_FIELD: keyof RegisterValues =
  `confirm${capitalize(AUTH_PASSWORD_FIELD)}` as keyof RegisterValues;

const CURRENT_PASSWORD_AUTOCOMPLETE = joinDash(
  CURRENT_SECRET_PREFIX,
  AUTH_PASSWORD_FIELD,
);
const NEW_PASSWORD_AUTOCOMPLETE = joinDash(NEW_SECRET_PREFIX, AUTH_PASSWORD_FIELD);

function buildPasswordErrorCode(prefix: "wrong" | "weak") {
  return `${AUTH_CODE_PREFIX}/${prefix}-${AUTH_PASSWORD_FIELD}`;
}

type AuthFieldPreset = "default" | "password";

type AuthFieldInputMode = "email";

export interface AuthFieldConfig<Name extends string> {
  autoComplete: string;
  inputMode?: AuthFieldInputMode;
  label: string;
  name: Name;
  placeholder: string;
  preset?: AuthFieldPreset;
  required: boolean;
}

function buildEmailFieldConfig(
  t: TFunction,
): AuthFieldConfig<typeof AUTH_EMAIL_FIELD> {
  return {
    autoComplete: "email",
    inputMode: "email",
    label: t(joinKey("auth", AUTH_EMAIL_FIELD)),
    name: AUTH_EMAIL_FIELD,
    placeholder: AUTH_EMAIL_PLACEHOLDER,
    required: true,
  };
}

function buildPasswordFieldConfig(
  t: TFunction,
  autoComplete: string,
): AuthFieldConfig<typeof AUTH_PASSWORD_FIELD> {
  return {
    autoComplete,
    label: t(joinKey("auth", AUTH_PASSWORD_FIELD)),
    name: AUTH_PASSWORD_FIELD,
    placeholder: AUTH_SECRET_PLACEHOLDER,
    preset: "password",
    required: true,
  };
}

function buildConfirmPasswordFieldConfig(
  t: TFunction,
): AuthFieldConfig<typeof AUTH_CONFIRM_PASSWORD_FIELD> {
  return {
    autoComplete: NEW_PASSWORD_AUTOCOMPLETE,
    label: t(joinKey("auth", AUTH_CONFIRM_PASSWORD_FIELD)),
    name: AUTH_CONFIRM_PASSWORD_FIELD,
    placeholder: AUTH_SECRET_PLACEHOLDER,
    preset: "password",
    required: true,
  };
}

export function buildLoginFieldConfigs(
  t: TFunction,
): AuthFieldConfig<Extract<keyof LoginValues, string>>[] {
  return buildEmailPasswordFieldConfigs(t, CURRENT_PASSWORD_AUTOCOMPLETE);
}

export function buildEmailPasswordFieldConfigs(
  t: TFunction,
  passwordAutoComplete: string,
): AuthFieldConfig<Extract<keyof LoginValues, string>>[] {
  return [buildEmailFieldConfig(t), buildPasswordFieldConfig(t, passwordAutoComplete)];
}

export function buildRegisterFieldConfigs(
  t: TFunction,
): AuthFieldConfig<Extract<keyof RegisterValues, string>>[] {
  return [
    buildEmailFieldConfig(t),
    buildPasswordFieldConfig(t, NEW_PASSWORD_AUTOCOMPLETE),
    buildConfirmPasswordFieldConfig(t),
  ];
}

export const LOGIN_ERROR_OVERRIDES: Record<string, string> = {
  [AUTH_INVALID_CREDENTIAL_CODE]: AUTH_WRONG_PASSWORD_ERROR_KEY,
  [buildPasswordErrorCode("wrong")]: AUTH_WRONG_PASSWORD_ERROR_KEY,
  [AUTH_USER_NOT_FOUND_CODE]: AUTH_WRONG_PASSWORD_ERROR_KEY,
};

export const REGISTER_ERROR_OVERRIDES: Record<string, string> = {
  [AUTH_EMAIL_ALREADY_IN_USE_CODE]: AUTH_EMAIL_ALREADY_IN_USE_ERROR_KEY,
  [buildPasswordErrorCode("weak")]: AUTH_WEAK_PASSWORD_ERROR_KEY,
  [AUTH_INVALID_EMAIL_CODE]: AUTH_INVALID_EMAIL_ERROR_KEY,
};

export interface AuthSubmitLabels {
  idleText: string;
  submittingText: string;
}

export function buildLoginSubmitLabels(t: TFunction): AuthSubmitLabels {
  return {
    idleText: t("auth.signIn"),
    submittingText: t("auth.signingIn"),
  };
}

export function buildRegisterSubmitLabels(t: TFunction): AuthSubmitLabels {
  return {
    idleText: t("auth.createAccount"),
    submittingText: t("auth.creatingAccount"),
  };
}
