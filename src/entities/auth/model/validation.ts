import type { TFunction } from "i18next";
import * as Yup from "yup";

export type LoginValues = {
  email: string;
  password: string;
};

export type RegisterValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export function createLoginSchema(t: TFunction): Yup.ObjectSchema<LoginValues> {
  return Yup.object({
    email: Yup.string()
      .trim()
      .email(t("auth.validation.emailInvalid"))
      .required(t("auth.validation.emailRequired")),
    password: Yup.string()
      .min(6, t("auth.validation.passwordMin"))
      .required(t("auth.validation.passwordRequired")),
  });
}

export function createRegisterSchema(
  t: TFunction,
): Yup.ObjectSchema<RegisterValues> {
  return Yup.object({
    email: Yup.string()
      .trim()
      .email(t("auth.validation.emailInvalid"))
      .required(t("auth.validation.emailRequired")),
    password: Yup.string()
      .min(6, t("auth.validation.passwordMin"))
      .required(t("auth.validation.passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("auth.validation.passwordsMustMatch"))
      .required(t("auth.validation.confirmPasswordRequired")),
  });
}
