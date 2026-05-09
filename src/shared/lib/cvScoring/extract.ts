import { SKILL_DICTIONARY, SENIORITY_KEYWORDS, type SkillDict } from "./dictionaries";
import { norm, uniq } from "./normalize";

export interface Extracted {
  skills: string[];
  seniority: "JUNIOR" | "MID" | "SENIOR" | "UNKNOWN";
  yearsDetected?: number;
  keywords: string[];
}

function phrases(skill: SkillDict): string[] {
  return uniq([skill.canonical, ...skill.synonyms]).map(norm);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text: string, phrase: string): boolean {
  const escapedPhrase = escapeRegExp(phrase).replace(/\s+/g, "\\s+");
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}#+])${escapedPhrase}(?=$|[^\\p{L}\\p{N}#+])`,
    "u",
  );

  return pattern.test(text);
}

export function detectSeniority(text: string): Extracted["seniority"] {
  const t = norm(text);
  const hasSenior = SENIORITY_KEYWORDS.senior.some((keyword) => hasPhrase(t, norm(keyword)));
  const hasMid = SENIORITY_KEYWORDS.mid.some((keyword) => hasPhrase(t, norm(keyword)));
  const hasJunior = SENIORITY_KEYWORDS.junior.some((keyword) => hasPhrase(t, norm(keyword)));

  if (hasSenior) return "SENIOR";
  if (hasMid) return "MID";
  if (hasJunior) return "JUNIOR";
  return "UNKNOWN";
}

function isYearsWord(token: string): boolean {
  return ["years", "year", "yrs", "yr", "jahre", "jahr"].includes(token);
}

function parseYearsCandidate(token: string): number | undefined {
  const raw = token.replace(/\+/g, "").trim();
  if (!/^\d{1,2}$/.test(raw)) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function detectYears(text: string): number | undefined {
  const tokens = norm(text)
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}+]/gu, ""))
    .filter(Boolean);

  let best: number | undefined;

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const years = parseYearsCandidate(tokens[index] ?? "");
    if (years === undefined) continue;
    if (!isYearsWord(tokens[index + 1] ?? "")) continue;
    if (best === undefined || years > best) best = years;
  }

  return best;
}

export function extractSkills(text: string): string[] {
  const t = norm(text);
  const found: string[] = [];
  for (const s of SKILL_DICTIONARY) {
    const hit = phrases(s).some((p) => p.length > 1 && hasPhrase(t, p));
    if (hit) found.push(s.canonical);
  }
  return uniq(found);
}

export function extractKeywordsFromJd(text: string): string[] {
  const t = norm(text);
  const base = extractSkills(t);
  const extra = [
    "graphql",
    "rest",
    "microservices",
    "clean architecture",
    "oauth",
    "jwt",
    "agile",
    "scrum",
    "tdd",
    "ddd",
    "performance",
    "accessibility",
    "a11y",
  ].filter((keyword) => hasPhrase(t, norm(keyword)));
  return uniq([...base, ...extra].map(norm));
}

export function extractFromJd(jdText: string): Extracted {
  const yearsDetected = detectYears(jdText);

  return {
    skills: extractSkills(jdText),
    seniority: detectSeniority(jdText),
    ...(yearsDetected !== undefined ? { yearsDetected } : {}),
    keywords: extractKeywordsFromJd(jdText),
  };
}

export function extractFromCv(cvText: string): Extracted {
  const skills = extractSkills(cvText);
  const yearsDetected = detectYears(cvText);

  return {
    skills,
    seniority: detectSeniority(cvText),
    ...(yearsDetected !== undefined ? { yearsDetected } : {}),
    keywords: uniq(skills.map(norm)),
  };
}
