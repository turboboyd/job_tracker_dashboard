import type { SearchFilters } from "./types";

export const DEFAULT_FILTERS: SearchFilters = {
  role: "",
  location: "",
  radiusKm: 30,
  workMode: "any",
};

function uniq(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function clampStr(s: string, maxLen: number) {
  const t = s.trim();
  return t.length > maxLen ? t.slice(0, maxLen).trim() : t;
}

function collapseWhitespace(value: string): string {
  let result = "";
  let isAfterWhitespace = false;

  for (const char of value.trim()) {
    if (char.trim() === "") {
      if (result.length > 0) isAfterWhitespace = true;
      continue;
    }

    if (isAfterWhitespace) result += " ";
    result += char;
    isAfterWhitespace = false;
  }

  return result;
}

function splitByHardSeparator(value: string): string[] {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    const isSeparator =
      char === "," ||
      char === ";" ||
      char === "|" ||
      char === "\n" ||
      char === "\r";

    if (isSeparator) {
      parts.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts;
}

function splitByOrToken(value: string): string[] {
  const parts: string[] = [];
  const currentWords: string[] = [];
  const words = collapseWhitespace(value).split(" ");

  for (const [index, word] of words.entries()) {
    const hasWordsBefore = currentWords.length > 0;
    const hasWordsAfter = index < words.length - 1;
    const isSeparator = word.toLowerCase() === "or";

    if (isSeparator && hasWordsBefore && hasWordsAfter) {
      parts.push(currentWords.join(" "));
      currentWords.length = 0;
      continue;
    }

    currentWords.push(word);
  }

  parts.push(currentWords.join(" "));
  return parts;
}

function splitRoleInput(value: string): string[] {
  return splitByHardSeparator(value).flatMap(splitByOrToken);
}

export function normalizeRoleToTitles(role: string): string[] {
  const input = role.trim();
  if (!input) return [];

  const normalized = collapseWhitespace(input);
  const parts = splitRoleInput(normalized)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => clampStr(p, 80));

  if (parts.length === 0) return [clampStr(normalized, 80)];

  return uniq(parts).slice(0, 12);
}

export function titlesToRole(titles: string[]): string {
  const cleaned = (titles ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => clampStr(t, 80));

  return uniq(cleaned).join(" OR ");
}

export function clampRadiusKm(v: number) {
  const n = Number.isFinite(v) ? v : 30;
  return Math.max(0, Math.min(200, Math.round(n)));
}

export function titlesToOrQuery(titles: string[]): string {
  const cleaned = titles.map((t) => t.trim()).filter(Boolean);
  return cleaned.join(" OR ");
}
