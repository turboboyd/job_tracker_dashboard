import { djb2Hash, normalizeText } from "../lib/text";
import type { ApplicationDoc } from "../types";

export function computeRoleFingerprint(app: ApplicationDoc): string {
  const base = `${app.job.companyName}::${app.job.roleTitle}::${app.job.locationText ?? ""}`;
  return `rf_${djb2Hash(normalizeText(base))}`;
}

export function withRoleFingerprint(
  app: ApplicationDoc,
  roleFingerprint: string,
): ApplicationDoc {
  return {
    ...app,
    vacancy: { ...(app.vacancy ?? {}), roleFingerprint },
  };
}
