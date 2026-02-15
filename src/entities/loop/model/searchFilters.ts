/* eslint-disable sonarjs/slow-regex */

import { SearchFilters } from "./types";

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

export function normalizeRoleToTitles(role: string): string[] {
  const input = (role ?? "").trim();
  if (!input) return [];

  const normalized = input
    .replace(/\|\|/g, " OR ")
    .replace(/\s+or\s+/gi, " OR ")
    .replace(/\s+OR\s+/g, " OR ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalized
    .split(/\s+OR\s+|,|;|\||\n|\r/g)
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
