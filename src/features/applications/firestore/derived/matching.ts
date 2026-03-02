import type { Timestamp } from "firebase/firestore";

import { normalizeText } from "../lib/text";
import type {
  ApplicationDoc,
  MatchingBlock,
  MatchingBreakdown,
  MatchingDecision,
  UserDoc,
} from "../types";

/**
 * Matching engine (client-side):
 * - Finds skills mentioned in roleTitle/rawDescription
 * - Computes a simple score
 * - Produces matchedSkillsTop + gapsTop
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function computeMatching(
  user: UserDoc | null,
  app: ApplicationDoc,
  t: Timestamp,
): MatchingBlock | undefined {
  if (!user) return undefined;

  const text = normalizeText(
    [
      app.job.roleTitle,
      app.job.companyName,
      app.job.locationText ?? "",
      app.vacancy?.rawDescription ?? "",
      (app.notes?.tags ?? []).join(" "),
    ].join(" "),
  );

  const skills = (user.skills ?? [])
    .slice()
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  if (skills.length === 0) return undefined;

  const matched: string[] = [];
  const gaps: string[] = [];

  for (const s of skills) {
    const tokenA = normalizeText(s.key);
    const tokenB = normalizeText(s.label);
    const hit =
      (tokenA && text.includes(tokenA)) || (tokenB && text.includes(tokenB));
    if (hit) matched.push(s.label || s.key);
    else gaps.push(s.label || s.key);
  }

  const topMatched = matched.slice(0, 10);
  const topGaps = gaps.slice(0, 10);

  const total = skills.length;
  const hitCount = matched.length;
  const skillScore = Math.round((hitCount / total) * 100);

  // Hard filter flags (example: remote preference)
  const hardFilterFlags: Record<string, boolean> = {};
  if (user.matchSettings?.hardFilters) {
    const hf = user.matchSettings.hardFilters;
    const workMode = app.job.workMode;
    if (workMode === "REMOTE" && !hf.allowRemote)
      hardFilterFlags.allowRemote = false;
    if (workMode === "HYBRID" && !hf.allowHybrid)
      hardFilterFlags.allowHybrid = false;
    if (workMode === "ON_SITE" && !hf.allowOnSite)
      hardFilterFlags.allowOnSite = false;
  }

  // Simple breakdown: we only have skills data right now, keep others 0
  const breakdown: MatchingBreakdown = {
    skills: skillScore,
    experience: 0,
    language: 0,
    location: 0,
    domain: 0,
    salary: 0,
  };

  let score = skillScore;
  const hasHardFails = Object.values(hardFilterFlags).some((v) => v === false);
  if (hasHardFails) score = Math.max(0, score - 30);

  let decision: MatchingDecision = "maybe";
  if (score >= 70) decision = "match";
  else if (score < 35) decision = "skip";

  // Confidence: higher when we have raw description and more skills
  const confidence = Math.min(
    1,
    0.3 +
      (app.vacancy?.rawDescription ? 0.3 : 0) +
      Math.min(0.4, skills.length / 25),
  );

  return {
    decision,
    score,
    breakdown,
    hardFilterFlags,
    matchedSkillsTop: topMatched,
    gapsTop: topGaps,
    computedAt: t,
    confidence,
  };
}
