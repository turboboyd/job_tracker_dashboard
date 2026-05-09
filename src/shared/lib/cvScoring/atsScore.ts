import {
  buildConfidence,
  buildDecision,
  buildGaps,
  buildHardFilterFlags,
  computeSkillsPoints,
  keywordCoverage,
  seniorityScore,
  yearsScore,
} from "./atsScore.helpers";
import type { AtsResult } from "./atsScore.types";
import { extractFromCv, extractFromJd } from "./extract";
import { clamp, round2, uniq } from "./normalize";

export type { AtsDecision, AtsResult } from "./atsScore.types";

export function atsScoreCvVsJd(cvText: string, jdText: string): AtsResult {
  const jd = extractFromJd(jdText);
  const cv = extractFromCv(cvText);

  const jdSkills = uniq(jd.skills);
  const cvSkills = uniq(cv.skills);
  const { matched, missing, coverage, skillsPts } = computeSkillsPoints(jdSkills, cvSkills);

  const sPts = seniorityScore(jd.seniority, cv.seniority);
  const yPts = yearsScore(jd.yearsDetected, cv.yearsDetected);
  const expPts = round2(clamp(sPts * 0.6 + yPts * 0.4, 0, 20));
  const kwCov = keywordCoverage(jd.keywords, cvText);
  const kwPts = round2(kwCov * 10);
  const missRatio = jdSkills.length === 0 ? 0 : missing.length / jdSkills.length;
  const redPenalty = round2(clamp(missRatio * 10, 0, 10));
  const raw = skillsPts + expPts + kwPts - redPenalty;
  const score = Math.round(clamp(raw, 0, 100));
  const hardFilterFlags = buildHardFilterFlags(missing, coverage, jdSkills.length);

  return {
    score,
    decision: buildDecision(score, hardFilterFlags),
    breakdown: {
      skills: skillsPts,
      experience: expPts,
      keywords: kwPts,
      redFlags: redPenalty,
    },
    hardFilterFlags,
    matchedSkills: matched.slice(0, 20),
    missingSkills: missing.slice(0, 20),
    gapsTop: buildGaps(missing),
    confidence: buildConfidence(jdSkills, cvSkills, jd, cv),
    evidence: {
      jdSkills,
      cvSkills,
      jdSeniority: jd.seniority,
      cvSeniority: cv.seniority,
      ...(jd.yearsDetected !== undefined ? { jdYears: jd.yearsDetected } : {}),
      ...(cv.yearsDetected !== undefined ? { cvYears: cv.yearsDetected } : {}),
      keywordCoverage: round2(kwCov),
    },
  };
}
