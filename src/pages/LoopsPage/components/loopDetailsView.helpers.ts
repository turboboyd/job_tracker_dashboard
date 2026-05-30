import type { Loop } from "src/entities/loop/model";
import type { LoopSourceStat } from "src/features/loops";
import type { VacancyMatch, VacancyMatchStatus } from "src/features/vacancyMatches";

export interface MatchesBucket {
  source: string;
  total: number;
  saved: number;
  converted: number;
  ignored: number;
  new: number;
}

const UNKNOWN_SOURCE = "unknown";

export function groupMatchesBySource(matches: readonly VacancyMatch[]): MatchesBucket[] {
  const buckets = new Map<string, MatchesBucket>();
  for (const m of matches) {
    const key = (m.source ?? UNKNOWN_SOURCE).toLowerCase().trim() || UNKNOWN_SOURCE;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { source: key, total: 0, saved: 0, converted: 0, ignored: 0, new: 0 };
      buckets.set(key, bucket);
    }
    bucket.total += 1;
    bucket[m.status] += 1;
  }
  return [...buckets.values()].sort((a, b) => b.total - a.total);
}

export function countMatchesByStatus(
  matches: readonly VacancyMatch[],
): Record<VacancyMatchStatus, number> {
  const counts: Record<VacancyMatchStatus, number> = {
    new: 0,
    saved: 0,
    converted: 0,
    ignored: 0,
  };
  for (const m of matches) counts[m.status] += 1;
  return counts;
}

export function countMatchesToday(matches: readonly VacancyMatch[], now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return matches.reduce((acc, m) => {
    const ts = Date.parse(m.createdAt);
    return Number.isFinite(ts) && ts >= startOfToday ? acc + 1 : acc;
  }, 0);
}

export function buildHeatmap(
  matches: readonly VacancyMatch[],
  days = 30,
  now: Date = new Date(),
): number[] {
  const result = Array.from({ length: days }, () => 0);
  const endOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const startMs = endOfTodayMs - days * 24 * 60 * 60 * 1000;
  for (const m of matches) {
    const ts = Date.parse(m.createdAt);
    if (!Number.isFinite(ts) || ts < startMs || ts >= endOfTodayMs) continue;
    const dayIdx = Math.floor((ts - startMs) / (24 * 60 * 60 * 1000));
    if (dayIdx >= 0 && dayIdx < days) result[dayIdx] += 1;
  }
  return result;
}

export type TimeAgoUnit = "now" | "minute" | "hour" | "day";

export interface TimeAgo {
  unit: TimeAgoUnit;
  value: number;
}

export function timeAgoFromIso(iso: string | null | undefined, now: Date = new Date()): TimeAgo | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return null;
  const diffSec = Math.max(0, Math.floor((now.getTime() - ts) / 1000));
  if (diffSec < 60) return { unit: "now", value: 0 };
  if (diffSec < 60 * 60) return { unit: "minute", value: Math.floor(diffSec / 60) };
  if (diffSec < 60 * 60 * 24) return { unit: "hour", value: Math.floor(diffSec / 3600) };
  return { unit: "day", value: Math.floor(diffSec / 86400) };
}

export function computeConversionRate(saved: number, applications: number): number | null {
  if (saved <= 0) return null;
  return Math.round((applications / saved) * 100);
}

export function computeMatchScore(match: VacancyMatch, loop: Loop): number {
  let score = 40;

  const title = (match.roleTitle ?? "").toLowerCase();
  const company = (match.companyName ?? "").toLowerCase();
  const location = (match.locationText ?? "").toLowerCase();
  const desc = (match.vacancyDescription ?? "").toLowerCase();
  const blob = `${title} ${company} ${location} ${desc}`;

  const titles = (loop.titles ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  for (const lt of titles) {
    const words = lt.split(/\s+/).filter(Boolean);
    if (title.includes(lt) || (words.length > 0 && words.every((w) => title.includes(w)))) {
      score += 20;
      break;
    }
  }

  const includes = (loop.keywords ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  let incHits = 0;
  for (const kw of includes) {
    if (blob.includes(kw)) {
      incHits += 1;
      if (incHits >= 5) break;
    }
  }
  score += incHits * 5;

  const excludes = (loop.excludedKeywords ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  for (const kw of excludes) {
    if (blob.includes(kw)) score -= 10;
  }

  const loopLoc = (loop.location ?? "").toLowerCase().trim();
  if (loopLoc && location.includes(loopLoc)) score += 10;

  const ts = Date.parse(match.createdAt);
  if (Number.isFinite(ts)) {
    const ageH = (Date.now() - ts) / 3_600_000;
    if (ageH < 12) score += 10;
    else if (ageH < 48) score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface LoopRecommendation {
  id: string;
  title: string;
  body: string;
}

export function generateLoopRecommendations(
  loop: Loop,
  matches: readonly VacancyMatch[],
  sourceStats: readonly LoopSourceStat[],
): LoopRecommendation[] {
  const recs: LoopRecommendation[] = [];
  const keywords = (loop.keywords ?? []).map((k) => k.toLowerCase());
  const sourceIds = (loop.selectedSources ?? []).map((s) => s.toLowerCase());

  const wantsRemote =
    (loop.workModes ?? []).some((m) => m === "remote" || m === "remote_only") ||
    loop.remoteMode === "remote_only";
  if (wantsRemote && !keywords.some((k) => k.includes("remote"))) {
    recs.push({
      id: "add-remote-kw",
      title: "Добавь «remote» в ключевые слова",
      body: "Это даст больше матчей среди удалённых вакансий — особенно с международных источников.",
    });
  }

  if (sourceIds.length <= 2) {
    recs.push({
      id: "more-sources",
      title: "Подключи больше источников",
      body: "Добавь Remotive или Arbeit Now — они работают без настройки и расширят выборку.",
    });
  }

  if (!loop.excludedKeywords?.length) {
    recs.push({
      id: "add-excludes",
      title: "Добавь слова-исключения",
      body: "Например, «senior», «manager» или «zeitarbeit» — это уберёт нерелевантные вакансии.",
    });
  }

  const totalMatches = matches.length;
  if (totalMatches > 5) {
    const dead = sourceStats.find(
      (s) =>
        s.matches === 0 &&
        s.health === "ok" &&
        sourceIds.includes(s.sourceId.toLowerCase()),
    );
    if (dead) {
      recs.push({
        id: `dead-${dead.sourceId}`,
        title: `Источник ${dead.sourceId} не приносит матчей`,
        body: "Возможно стоит убрать его и попробовать другой.",
      });
    }
  }

  if (totalMatches > 10 && sourceStats.length > 1) {
    const ranked = sourceStats
      .filter((s) => s.matches > 0)
      .slice()
      .sort((a, b) => b.matches - a.matches);
    const top = ranked[0];
    if (top && top.matches > totalMatches * 0.5) {
      recs.push({
        id: `top-${top.sourceId}`,
        title: `${top.sourceId} — лидер по матчам`,
        body: `На него приходится ${Math.round(
          (top.matches / totalMatches) * 100,
        )}% всех вакансий. Стоит подобрать похожие источники.`,
      });
    }
  }

  return recs;
}
