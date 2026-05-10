import type { Timestamp } from "firebase/firestore";

import type { ApplicationDoc } from "../documents.types";
import type { PriorityBlock } from "../domain.types";

/**
 * Priority calculation (client-side):
 * A small heuristic that helps Today view.
 */
export function computePriority(app: ApplicationDoc, t: Timestamp): PriorityBlock {
  const reasons: string[] = [];
  let score = 0;

  switch (app.process.status) {
    case "SAVED":
      score = 75;
      reasons.push("saved_new");
      break;
    case "PLANNED":
      score = 70;
      reasons.push("planned");
      break;
    case "APPLIED":
      score = 60;
      reasons.push("applied");
      break;
    case "VIEWED":
      score = 58;
      reasons.push("viewed");
      break;
    case "INTERVIEW_1":
      score = 52;
      reasons.push("interview");
      break;
    case "INTERVIEW_2":
      score = 45;
      reasons.push("interview_2");
      break;
    case "TEST_TASK":
      score = 50;
      reasons.push("test_task");
      break;
    case "OFFER":
      score = 30;
      reasons.push("offer");
      break;
    case "REJECTED":
    case "NO_RESPONSE":
      score = 10;
      reasons.push("closed");
      break;
    default:
      score = 40;
  }

  if (app.job.vacancyUrl) {
    score += 5;
    reasons.push("has_url");
  }
  if (app.process.needsFollowUp) {
    score += 10;
    reasons.push("followup_due");
  }
  if (app.process.needsReapplySuggestion) {
    score += 6;
    reasons.push("reapply_possible");
  }

  // Matching boosts priority for strong matches
  if (app.matching?.decision === "match") {
    score += 6;
    reasons.push("strong_match");
  } else if (app.matching?.decision === "skip") {
    score -= 8;
    reasons.push("weak_match");
  }

  score = Math.max(0, Math.min(100, score));

  return { score, reasons, computedAt: t };
}
