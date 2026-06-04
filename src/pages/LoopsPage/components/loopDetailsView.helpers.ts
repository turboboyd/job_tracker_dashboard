import { joinTitles, type Loop, type LoopStatus } from "src/entities/loop";
import type { LoopSourceStat } from "src/features/loops";
import type { VacancyMatch, VacancyMatchStatus } from "src/features/vacancyMatches";

import type { ChipDef, StatTile } from "./loopDetailsView.types";

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

export const SOURCE_COLORS: Record<string, string> = {
  linkedin: "#0a66c2",
  stepstone: "#005c5c",
  indeed: "#2164f3",
  xing: "#006567",
  arbeitsagentur: "#dc2626",
  jobvector: "#1d4ed8",
  joblift: "#1e3a8a",
  kimeta: "#ea580c",
  adzuna: "#7c3aed",
  remotive: "#10b981",
  arbeitnow: "#0f172a",
  remotejobs: "#f97316",
  himalayas: "#0ea5e9",
  remoteok: "#f43f5e",
  greenhouse: "#22c55e",
  lever: "#3b82f6",
  manual_url: "#6b7280",
  company_websites: "#6b7280",
};

export function getSourceColor(sourceId: string): string {
  return SOURCE_COLORS[sourceId.toLowerCase()] ?? "#6b7280";
}

export function buildStatTiles(
  t: (key: string, fallback: string, opts?: Record<string, unknown>) => string,
  params: {
    savedTotal: number;
    appliedTotal: number;
    matchesToday: number;
    conversionRate: number | null;
  },
): StatTile[] {
  const { savedTotal, appliedTotal, matchesToday, conversionRate } = params;
  const appliedPct =
    savedTotal > 0
      ? t("loops.statAppliedPct", "{{value}}% of saved", {
          value: Math.round((appliedTotal / savedTotal) * 100),
        })
      : t("loops.dash", "—");
  return [
    { label: t("loops.statMatches", "Matches"), value: savedTotal, sub: t("loops.statMatchesSub", "Saved matches"), accent: false },
    { label: t("loops.statApplied", "Applied"), value: appliedTotal, sub: appliedPct, accent: true },
    { label: t("loops.statToday", "Today"), value: matchesToday, sub: t("loops.statTodaySub", "New today"), accent: false },
    { label: t("loops.statConversion", "Conversion"), value: conversionRate !== null ? `${conversionRate}%` : "—", sub: t("loops.statConversionSub", "Saved → applied"), accent: false },
  ];
}

export function buildLoopChips(loop: Loop, labels: Record<string, string>): ChipDef[] {
  const isRemote = loop.filters?.workMode === "remote_only" || loop.remoteMode === "remote_only";
  const radiusKm = loop.filters?.radiusKm ?? loop.radiusKm;

  const raw: ChipDef[] = [
    { label: labels.role, value: loop.filters?.role || joinTitles(loop.titles) },
    { label: labels.location, value: loop.filters?.location || loop.location },
    { label: labels.radius, value: radiusKm > 0 ? `${radiusKm} km` : "" },
    { label: labels.mode, value: isRemote ? labels.remote : labels.any },
    { label: labels.employment, value: loop.filters?.employmentType ?? "" },
  ];

  return raw.filter((chip) => chip.value && chip.value !== "—");
}

export const MATCH_STATUS_STYLES: Record<VacancyMatchStatus, { key: string; cls: string }> = {
  new:       { key: "loops.statusNew",       cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  saved:     { key: "loops.statusSaved",     cls: "bg-muted text-muted-foreground" },
  ignored:   { key: "loops.statusIgnored",   cls: "bg-muted text-muted-foreground opacity-60" },
  converted: { key: "loops.statusConverted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

export function getStatusBadgeClass(status: LoopStatus): string {
  if (status === "archived") return "bg-muted text-muted-foreground";
  if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

export const HISTORY_STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed_with_warnings: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  skipped: "bg-muted text-muted-foreground",
};
