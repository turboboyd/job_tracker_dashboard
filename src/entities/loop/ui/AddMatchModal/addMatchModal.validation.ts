import type { TFunction } from "i18next";
import * as Yup from "yup";

import type { LoopPlatform } from "../../model";

import {
  platformValues,
  statusValues,
} from "./addMatchModal.options";
import type { AddMatchFormValues } from "./addMatchModal.types";
import { tryParseUrl } from "./addMatchModal.url";

export function makeAddMatchSchema(t: TFunction) {
  return Yup.object({
    title: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.titleRequired", { defaultValue: "Title is required" }),
      )
      .required(
        t("loops.validation.titleRequired", { defaultValue: "Title is required" }),
      ),

    company: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.companyRequired", { defaultValue: "Company is required" }),
      )
      .required(
        t("loops.validation.companyRequired", { defaultValue: "Company is required" }),
      ),

    location: Yup.string()
      .trim()
      .min(
        2,
        t("loops.validation.locationRequired", { defaultValue: "Location is required" }),
      )
      .required(
        t("loops.validation.locationRequired", { defaultValue: "Location is required" }),
      ),

    platform: Yup.mixed<LoopPlatform>()
      .oneOf(platformValues)
      .required(
        t("loops.validation.platformRequired", { defaultValue: "Platform is required" }),
      ),

    url: Yup.string()
      .trim()
      .required(
        t("loops.validation.urlRequired", { defaultValue: "Job URL is required" }),
      )
      .test(
        "is-url",
        t("loops.validation.invalidUrl", { defaultValue: "Invalid URL" }),
        (value) => Boolean(tryParseUrl(value ?? "")),
      ),

    description: Yup.string()
      .trim()
      .min(
        1,
        t("loops.validation.descriptionRequired", {
          defaultValue: "Description is required",
        }),
      )
      .required(
        t("loops.validation.descriptionRequired", {
          defaultValue: "Description is required",
        }),
      ),

    status: Yup.mixed<AddMatchFormValues["status"]>()
      .oneOf(statusValues)
      .required(
        t("loops.validation.statusRequired", { defaultValue: "Status is required" }),
      ),

    matchedAt: Yup.string().trim().required(),
  }) as Yup.ObjectSchema<AddMatchFormValues>;
}

