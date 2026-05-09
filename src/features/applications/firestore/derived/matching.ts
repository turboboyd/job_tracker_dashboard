import type { Timestamp } from "firebase/firestore";

import { extractSkills } from "src/shared/lib/cvScoring";

import type { ApplicationDoc, UserDoc } from "../documents.types";
import type { MatchingBlock, MatchingBreakdown, MatchingDecision } from "../domain.types";
import { normalizeText } from "../lib/text";

function buildJdText(app: ApplicationDoc): string {
  return normalizeText(
    [
      app.job.roleTitle,
      app.job.companyName,
      app.job.locationText ?? "",
      app.vacancy?.rawDescription ?? "",
      (app.notes?.tags ?? []).join(" "),
    ].join(" "),
  );
}

function buildUserSkillTokens(user: UserDoc): string[] {
  return (user.skills ?? [])
    .slice()
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
    .flatMap((skill) => [skill.key, skill.label])
    .filter(Boolean)
    .map((token) => normalizeText(String(token)));
}

function splitMatchedSkills(jdSkills: string[], userSkillTokens: string[]) {
  const matched: string[] = [];
  const gaps: string[] = [];

  for (const jdSkill of jdSkills) {
    const hit = userSkillTokens.some(
      (token) => token === jdSkill || token.includes(jdSkill) || jdSkill.includes(token),
    );

    if (hit) matched.push(jdSkill);
    else gaps.push(jdSkill);
  }

  return { matched, gaps };
}

function buildHardFilterFlags(user: UserDoc, app: ApplicationDoc): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  const filters = user.matchSettings?.hardFilters;
  if (!filters) return flags;

  const workMode = app.job.workMode;
  if (workMode === "REMOTE" && !filters.allowRemote) flags.allowRemote = false;
  if (workMode === "HYBRID" && !filters.allowHybrid) flags.allowHybrid = false;
  if (workMode === "ON_SITE" && !filters.allowOnSite) flags.allowOnSite = false;
  return flags;
}

function buildBreakdown(skillScore: number): MatchingBreakdown {
  return {
    skills: skillScore,
    experience: 0,
    language: 0,
    location: 0,
    domain: 0,
    salary: 0,
  };
}

function buildDecision(score: number): MatchingDecision {
  if (score >= 70) return "match";
  if (score < 35) return "skip";
  return "maybe";
}

function buildConfidence(app: ApplicationDoc, jdSkills: string[]): number {
  return Math.min(
    1,
    0.35 +
      (app.vacancy?.rawDescription ? 0.25 : 0) +
      Math.min(0.4, jdSkills.length / 20),
  );
}

export function computeMatching(
  user: UserDoc | null,
  app: ApplicationDoc,
  t: Timestamp,
): MatchingBlock | undefined {
  if (!user) return undefined;

  const jdSkills = extractSkills(buildJdText(app));
  if (jdSkills.length === 0) return undefined;

  const { matched, gaps } = splitMatchedSkills(jdSkills, buildUserSkillTokens(user));
  const skillScore = Math.round((matched.length / jdSkills.length) * 100);
  const hardFilterFlags = buildHardFilterFlags(user, app);
  const hasHardFails = Object.values(hardFilterFlags).some((value) => value === false);
  const score = hasHardFails ? Math.max(0, skillScore - 30) : skillScore;

  return {
    decision: buildDecision(score),
    score,
    breakdown: buildBreakdown(skillScore),
    hardFilterFlags,
    matchedSkillsTop: matched.slice(0, 10),
    gapsTop: gaps.slice(0, 10),
    computedAt: t,
    confidence: buildConfidence(app, jdSkills),
  };
}
