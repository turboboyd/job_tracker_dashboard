import type { AtsDecision, AtsResult } from "./atsScore.types";
import { SKILL_DICTIONARY } from "./dictionaries";
import { clamp, round2 } from "./normalize";

interface ExtractedCvSignal {
  seniority: string;
  yearsDetected?: number;
}

function skillWeight(skill: string): number {
  const s = SKILL_DICTIONARY.find((x) => x.canonical === skill);
  return s?.weight ?? 1.0;
}

export function seniorityScore(jd: string, cv: string): number {
  const rank = (x: string): number => {
    if (x === "JUNIOR") return 1;
    if (x === "MID") return 2;
    if (x === "SENIOR") return 3;
    return 0;
  };

  const rJ = rank(jd);
  const rC = rank(cv);
  if (rJ === 0 || rC === 0) return 10;
  if (rC >= rJ) return 20;
  if (rC === rJ - 1) return 12;
  return 6;
}

export function yearsScore(jdYears?: number, cvYears?: number): number {
  if (!jdYears && !cvYears) return 10;
  if (jdYears && !cvYears) return 8;
  if (!jdYears && cvYears) return 12;

  const j = jdYears ?? 0;
  const c = cvYears ?? 0;
  if (j <= 0) return 12;

  const ratio = c / j;
  if (ratio >= 1.0) return 20;
  if (ratio >= 0.75) return 16;
  if (ratio >= 0.5) return 12;
  return 6;
}

export function keywordCoverage(jdKeywords: string[], cvText: string): number {
  if (jdKeywords.length === 0) return 1.0;
  const low = cvText.toLowerCase();
  let hit = 0;
  for (const keyword of jdKeywords) {
    if (keyword && low.includes(keyword.toLowerCase())) hit += 1;
  }
  return clamp(hit / jdKeywords.length, 0, 1);
}

export function buildGaps(missing: string[]): AtsResult["gapsTop"] {
  return missing
    .map((key) => {
      const weight = skillWeight(key);
      const impact = clamp(Math.round(6 * weight), 1, 10);
      const effort = clamp(6 - Math.round(2 * (weight - 1)), 1, 10);
      const priority = round2(impact / Math.max(1, effort));

      return {
        key,
        label: key,
        reason: "Missing important skill from JD",
        impact,
        effort,
        priority,
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);
}

export function computeSkillsPoints(jdSkills: string[], cvSkills: string[]) {
  const matched = jdSkills.filter((skill) => cvSkills.includes(skill));
  const missing = jdSkills.filter((skill) => !cvSkills.includes(skill));
  const totalW = jdSkills.reduce((sum, skill) => sum + skillWeight(skill), 0);
  const matchedW = matched.reduce((sum, skill) => sum + skillWeight(skill), 0);
  const coverage = totalW <= 0 ? 0 : clamp(matchedW / totalW, 0, 1);

  return {
    matched,
    missing,
    coverage,
    skillsPts: round2(coverage * 60),
  };
}

export function buildHardFilterFlags(
  missing: string[],
  coverage: number,
  totalSkills: number,
): string[] {
  const flags: string[] = [];
  if (missing.length >= 6) flags.push("MANY_MISSING_SKILLS");
  if (coverage < 0.35 && totalSkills >= 6) flags.push("LOW_SKILL_COVERAGE");
  return flags;
}

export function buildDecision(score: number, hardFilterFlags: string[]): AtsDecision {
  if (score >= 75 && hardFilterFlags.length === 0) return "APPLY";
  if (score < 55 || hardFilterFlags.includes("LOW_SKILL_COVERAGE")) return "SKIP";
  return "MAYBE";
}

export function buildConfidence(
  jdSkills: string[],
  cvSkills: string[],
  jd: ExtractedCvSignal,
  cv: ExtractedCvSignal,
) {
  const signalCount =
    (jdSkills.length > 0 ? 1 : 0) +
    (cvSkills.length > 0 ? 1 : 0) +
    (jd.yearsDetected ? 1 : 0) +
    (cv.yearsDetected ? 1 : 0) +
    (jd.seniority !== "UNKNOWN" ? 1 : 0) +
    (cv.seniority !== "UNKNOWN" ? 1 : 0);

  return round2(clamp(0.35 + signalCount * 0.1, 0, 1));
}
