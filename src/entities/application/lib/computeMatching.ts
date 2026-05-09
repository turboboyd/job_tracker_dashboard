import { extractSkills } from "src/shared/lib/cvScoring";

export function computeMatching(profileSkills: string[], jdText: string) {
  const jdSkills = extractSkills(jdText);

  const matched = jdSkills.filter((s: string) => profileSkills.includes(s));
  const missing = jdSkills.filter((s: string) => !profileSkills.includes(s));

  const score =
    jdSkills.length === 0
      ? 0
      : Math.round((matched.length / jdSkills.length) * 100);

  return {
    score,
    matchedSkillsTop: matched,
    gapsTop: missing
  };
}
