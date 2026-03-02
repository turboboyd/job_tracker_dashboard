import type { Timestamp } from "firebase/firestore";

import { REAPPLY_COOLDOWN_DAYS } from "../lib/constants";
import { addDays } from "../lib/time";
import type { ApplicationDoc } from "../types";

/**
 * Re-apply logic (client-side):
 * Suggest reapply when:
 * - status is REJECTED or NO_RESPONSE
 * - and last status change is >= 30 days ago
 */
export function computeReapply(
  app: ApplicationDoc,
  t: Timestamp,
): {
  needsReapplySuggestion: boolean;
  reapplyEligibleAt?: Timestamp;
  reapplyReason?: string;
} {
  const status = app.process.status;
  const eligibleStatuses = ["REJECTED", "NO_RESPONSE"].includes(status);
  if (!eligibleStatuses) {
    return { needsReapplySuggestion: false };
  }

  const last = app.process.lastStatusChangeAt;
  const eligibleAt = addDays(last, REAPPLY_COOLDOWN_DAYS);
  const eligible = t.toMillis() >= eligibleAt.toMillis();

  return {
    needsReapplySuggestion: eligible,
    ...(eligible ? { reapplyEligibleAt: eligibleAt } : {}),
    ...(eligible ? { reapplyReason: "cooldown_elapsed" } : {}),
  };
}
