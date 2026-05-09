import type { TFunction } from "i18next";
import * as Yup from "yup";

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  email: string;
  password: string;
  confirmPassword: string;
}

function createEmailField(t: TFunction) {
  return Yup.string()
    .trim()
    .email(t("auth.validation.emailInvalid"))
    .required(t("auth.validation.emailRequired"));
}

function createPasswordField(t: TFunction) {
  return Yup.string()
    .min(6, t("auth.validation.passwordMin"))
    .required(t("auth.validation.passwordRequired"));
}

export function createLoginSchema(t: TFunction): Yup.ObjectSchema<LoginValues> {
  return Yup.object({
    email: createEmailField(t),
    password: createPasswordField(t),
  });
}

export function createRegisterSchema(
  t: TFunction,
): Yup.ObjectSchema<RegisterValues> {
  return Yup.object({
    email: createEmailField(t),
    password: createPasswordField(t),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("auth.validation.passwordsMustMatch"))
      .required(t("auth.validation.confirmPasswordRequired")),
  });
}
