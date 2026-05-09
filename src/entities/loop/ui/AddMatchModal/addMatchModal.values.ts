import type { LoopPlatform } from "../../model";

import type { AddMatchFormValues } from "./addMatchModal.types";

export function isoNow() {
  return new Date().toISOString();
}

export function platformOrDefault(
  platform: LoopPlatform | undefined,
): LoopPlatform {
  return platform ?? "linkedin";
}

export function buildInitialValues(
  defaultPlatform: LoopPlatform | undefined,
): AddMatchFormValues {
  return {
    title: "",
    company: "",
    location: "",
    platform: platformOrDefault(defaultPlatform),
    url: "",
    description: "",
    status: "SAVED",
    matchedAt: isoNow(),
  };
}

