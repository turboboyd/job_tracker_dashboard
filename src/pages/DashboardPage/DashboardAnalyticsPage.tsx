import { ArrowUpRight, Download, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { toMillis } from "src/shared/lib/firestore/toMillis";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardTrendsCard,
  DashboardInsightsCard,
  DashboardStatusRadarCard,
} from "./ui";
import type { ModeKey, RangeKey } from "./ui/trends/trends.types";

type CustomRange = { from: Date; to: Date } | null;

// ─── Type alias for MatchLike items from matchesAll ───────────────────────────

type MatchLike = {
  id: string;
  loopId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  status?: unknown;
  statusHistory?: Array<{ status: unknown; date?: unknown; changedAt?: unknown }>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function getISOWeek(d: Date): string {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function weekStartLabel(weekKey: string): string {
  const [year, wStr] = weekKey.split("-W");
  const week = parseInt(wStr);
  const jan1 = new Date(parseInt(year), 0, 1);
  const dayOffset = (week - 1) * 7 - jan1.getDay() + 1;
  const d = new Date(parseInt(year), 0, 1 + dayOffset);
  return d
    .toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    .replace(".", "");
}

function bucketByPeriod(
  items: MatchLike[],
  fromMs: number,
  toMs: number,
  buckets: number,
): Array<{ applied: number; replied: number; hired: number }> {
  const step = (toMs - fromMs) / buckets;
  const result = Array.from({ length: buckets }, () => ({
    applied: 0,
    replied: 0,
    hired: 0,
  }));
  for (const m of items) {
    if ((m.status as string) === "SAVED") continue;
    const ms = toMillis(m.createdAt) ?? 0;
    if (ms < fromMs || ms > toMs) continue;
    const idx = Math.min(Math.floor((ms - fromMs) / step), buckets - 1);
    result[idx].applied++;
    const s = m.status as string;
    if (
      ["INTERVIEW_1", "INTERVIEW_2", "TEST_TASK", "OFFER", "HIRED"].includes(s)
    )
      result[idx].replied++;
    if (s === "HIRED") result[idx].hired++;
  }
  return result;
}

function clampDayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function presetDays(range: Exclude<RangeKey, "custom">): number {
  if (range === "12m") return 365;
  if (range === "90d") return 90;
  if (range === "30d") return 30;
  return 7;
}

// ─── Sparkline (SVG polyline) ─────────────────────────────────────────────────

function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const h = 40;
  const w = 100;
  const n = data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (n - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: h }}
      aria-hidden="true"
    >
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  labels,
  height = 160,
}: {
  data: number[];
  labels: string[];
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div
      className="relative flex items-end gap-1.5 pb-5"
      style={{ height }}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const isLast = i === data.length - 1;
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center" style={{ height: "100%" }}>
            <div className="flex flex-1 w-full flex-col justify-end">
              <div
                className="w-full rounded-t-[3px] relative"
                style={{
                  height: `${pct}%`,
                  background: isLast ? "var(--primary)" : "hsl(var(--muted))",
                  border: `1px solid ${isLast ? "var(--primary)" : "hsl(var(--border))"}`,
                  minHeight: 2,
                }}
              >
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground tabular-nums">
                  {v}
                </span>
              </div>
            </div>
            <span
              className="absolute bottom-0 text-[9px] text-muted-foreground"
              style={{
                left: `${(i / (data.length - 1)) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
      {children}
    </p>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
  padding = "p-5",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`rounded-[14px] border border-border bg-card ${padding} ${className}`}>
      {children}
    </div>
  );
}

// ─── Time range toggle ────────────────────────────────────────────────────────

type TimeRange = "7d" | "30d" | "90d" | "all";

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "7d", label: "7д" },
  { key: "30d", label: "30д" },
  { key: "90d", label: "90д" },
  { key: "all", label: "Всё" },
];

function RangeToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  return (
    <div className="inline-flex gap-0 rounded-[7px] border border-border bg-muted/50 p-0.5">
      {RANGES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={[
            "rounded-[5px] px-2.5 py-1 text-[12px] transition-colors cursor-pointer",
            value === key
              ? "bg-card font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DashboardAnalyticsPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [range, setRange] = useState<RangeKey>("7d");
  const [mode, setMode] = useState<ModeKey>("created");
  const [customRange, setCustomRange] = useState<CustomRange>(null);

  const { loops, loopsFilter, setLoopsFilter, chartMatches, pipelineSummary, matchesAll } =
    useDashboardData();

  // ── Time range bounds ───────────────────────────────────────────────────────

  const rangeDays =
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 3650;
  const fromMs = timeRange === "all" ? nowMs - 3650 * 86400000 : nowMs - rangeDays * 86400000;
  const toMs = nowMs;

  // ── rangeMatches — matches within selected time window ──────────────────────

  const rangeMatches = useMemo(
    () =>
      (matchesAll as MatchLike[]).filter((m) => {
        const ms = toMillis(m.createdAt) ?? 0;
        return ms >= fromMs && ms <= toMs;
      }),
    [matchesAll, fromMs, toMs],
  );

  // ── KPI — real ──────────────────────────────────────────────────────────────

  const totalApplied = rangeMatches.filter((m) => (m.status as string) !== "SAVED").length;

  const hrScreenCount =
    (pipelineSummary.byColumn["INTERVIEW"] ?? 0) +
    (pipelineSummary.byColumn["OFFER"] ?? 0) +
    (pipelineSummary.byColumn["HIRED"] ?? 0);

  const offerCount =
    (pipelineSummary.byColumn["OFFER"] ?? 0) + (pipelineSummary.byColumn["HIRED"] ?? 0);

  const replyRate =
    pipelineSummary.total > 0
      ? Math.round((hrScreenCount / pipelineSummary.total) * 100)
      : 0;
  const interviewRate =
    pipelineSummary.total > 0
      ? Math.round((offerCount / pipelineSummary.total) * 100)
      : 0;

  // ── Median cycle time ───────────────────────────────────────────────────────

  const cycleDays = useMemo(() => {
    const durations: number[] = [];
    for (const m of matchesAll as MatchLike[]) {
      const s = m.status as string;
      if (!["REJECTED", "HIRED", "NO_RESPONSE"].includes(s)) continue;
      const created = toMillis(m.createdAt) ?? 0;
      const updated = toMillis(m.updatedAt) ?? 0;
      if (created && updated && updated > created) {
        durations.push((updated - created) / 86400000);
      }
    }
    return Math.round(median(durations)) || 0;
  }, [matchesAll]);

  // ── Sparklines (10 buckets over selected time range) ───────────────────────

  const sparkBuckets = useMemo(
    () => bucketByPeriod(matchesAll as MatchLike[], fromMs, toMs, 10),
    [matchesAll, fromMs, toMs],
  );
  const sparkApplied = sparkBuckets.map((b) => b.applied);
  const sparkReply = sparkBuckets.map((b) =>
    b.applied > 0 ? Math.round((b.replied / b.applied) * 100) : 0,
  );

  // ── KPI cards ──────────────────────────────────────────────────────────────

  const kpis = [
    {
      l: "Заявок отправлено",
      v: totalApplied > 0 ? String(totalApplied) : "—",
      d: null as string | null,
      trend: sparkApplied.some((x) => x > 0) ? sparkApplied : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      color: "#10b981",
    },
    {
      l: "Ответили компании",
      v: replyRate > 0 ? `${replyRate}%` : "—",
      d: null as string | null,
      trend: sparkReply.some((x) => x > 0) ? sparkReply : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      color: "#6366f1",
    },
    {
      l: "Дошли до оффера",
      v: interviewRate > 0 ? `${interviewRate}%` : "—",
      d: null as string | null,
      // TODO(backend-migration): needs historical aggregation from GET /api/v1/analytics/kpi
      trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      color: "#f59e0b",
    },
    {
      l: "Среднее время цикла",
      v: cycleDays > 0 ? `${cycleDays}д` : "—",
      d: null as string | null,
      // TODO(backend-migration): needs per-period median from GET /api/v1/analytics/kpi
      trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      color: "#10b981",
    },
  ];

  // ── Funnel (real from pipelineSummary.byColumn) ────────────────────────────

  const fTotal = pipelineSummary.total;
  const fHr = hrScreenCount;
  const fOffer = offerCount;
  const fHired = pipelineSummary.byColumn["HIRED"] ?? 0;

  const funnelSteps = [
    {
      l: "Отклики",
      v: fTotal,
      w: 100,
      c: "var(--primary)",
    },
    {
      l: "HR-скрин",
      v: fHr,
      w: fTotal > 0 ? (fHr / fTotal) * 100 : 0,
      c: "var(--primary)",
    },
    {
      l: "Оффер",
      v: fOffer,
      w: fTotal > 0 ? (fOffer / fTotal) * 100 : 0,
      c: "#f59e0b",
    },
    {
      l: "Принят",
      v: fHired,
      w: fTotal > 0 ? (fHired / fTotal) * 100 : 0,
      c: "#10b981",
    },
  ];

  // ── Weekly activity chart (real, bucketed by ISO week) ─────────────────────

  const weeklyChartData = useMemo(() => {
    const weekCount =
      timeRange === "7d" ? 2 : timeRange === "30d" ? 5 : timeRange === "90d" ? 13 : 26;
    const map = new Map<string, number>();
    for (const m of matchesAll as MatchLike[]) {
      if ((m.status as string) === "SAVED") continue;
      const ms = toMillis(m.createdAt) ?? 0;
      if (ms < fromMs) continue;
      const key = getISOWeek(new Date(ms));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const rawKeys: string[] = [];
    for (let i = weekCount - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 7 * 86400000);
      rawKeys.push(getISOWeek(d));
    }
    const deduped = [...new Set(rawKeys)].slice(-weekCount);
    return {
      data: deduped.map((k) => map.get(k) ?? 0),
      labels: deduped.map(weekStartLabel),
    };
  }, [matchesAll, fromMs, nowMs, timeRange]);

  // ── Loss breakdown (real where possible) ──────────────────────────────────

  const lossBreakdown = useMemo(() => {
    const noResp = pipelineSummary.byColumn["NO_RESPONSE"] ?? 0;
    const rejTotal = pipelineSummary.byColumn["REJECTED"] ?? 0;
    let afterHr = 0;
    let afterTech = 0;
    for (const m of matchesAll as MatchLike[]) {
      if ((m.status as string) !== "REJECTED") continue;
      const hist = m.statusHistory ?? [];
      const maxStage = hist.reduce((best, h) => {
        const s = h.status as string;
        const rank = [
          "SAVED",
          "ACTIVE",
          "INTERVIEW_1",
          "INTERVIEW_2",
          "TEST_TASK",
          "OFFER",
          "HIRED",
        ].indexOf(s);
        return rank > best ? rank : best;
      }, 0);
      if (maxStage >= 4) afterTech++;
      else if (maxStage >= 2) afterHr++;
    }
    const rows = [
      { l: "Нет ответа > 14д", v: noResp },
      { l: "Отказ после HR", v: afterHr },
      { l: "Отказ после тех.", v: afterTech },
      { l: "Другой отказ", v: Math.max(0, rejTotal - afterHr - afterTech) },
    ];
    const tot = rows.reduce((s, x) => s + x.v, 0);
    return rows.map((r) => ({
      ...r,
      p: tot > 0 ? Math.round((r.v / tot) * 100) : 0,
    }));
  }, [matchesAll, pipelineSummary]);

  const topLoss = [...lossBreakdown].sort((a, b) => b.v - a.v)[0];
  const insightText =
    topLoss && topLoss.v > 0
      ? `Чаще всего теряешь заявки из-за «${topLoss.l}» — ${topLoss.p}% от всех потерь.`
      : "Недостаточно данных для анализа.";

  // ── Sources: no platform field in Firebase — placeholder ──────────────────
  // TODO(backend-migration): platform field not tracked in current Firebase schema
  // Needs GET /api/v1/analytics/sources — see doc-backend/Аналитика_backend.md

  // ── filteredMatches for DashboardTrendsCard ────────────────────────────────

  const filteredMatches = useMemo(() => {
    let filterFromMs = 0;
    let filterToMs = nowMs;

    if (range === "custom" && customRange) {
      filterFromMs = clampDayStart(customRange.from.getTime());
      filterToMs = clampDayStart(customRange.to.getTime()) + 24 * 60 * 60 * 1000 - 1;
    } else {
      const days = presetDays(range as Exclude<RangeKey, "custom">);
      filterFromMs = nowMs - days * 24 * 60 * 60 * 1000;
      filterToMs = nowMs;
    }

    return chartMatches.filter((m) => {
      const ts =
        mode === "updated"
          ? toMillis(m.updatedAt) || toMillis(m.createdAt)
          : toMillis(m.createdAt);
      return ts ? ts >= filterFromMs && ts <= filterToMs : false;
    });
  }, [chartMatches, range, mode, customRange, nowMs]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <span className="text-muted-foreground">Аналитика</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                Аналитика
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Что работает в твоём поиске, а что съедает время впустую.
              </p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <RangeToggle value={timeRange} onChange={setTimeRange} />
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Экспорт
              </button>
              <button
                type="button"
                onClick={() => setLoopsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                {t("loopsFilter.button", "Циклы")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DashboardLoopsFilterModal
        open={loopsModalOpen}
        onOpenChange={setLoopsModalOpen}
        value={loopsFilter}
        loops={loops}
        onChange={setLoopsFilter}
      />

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex flex-col gap-3.5 p-7">
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.l} padding="p-4">
                <SLabel>{k.l}</SLabel>
                <div className="flex items-baseline gap-2 mt-2 mb-2">
                  <span className="text-[28px] font-semibold tracking-[-0.025em] tabular-nums text-foreground">
                    {k.v}
                  </span>
                  {k.d !== null && (
                    <span className="text-[12px] font-medium text-emerald-500">{k.d}</span>
                  )}
                </div>
                {/* TODO(backend-migration): precise sparklines from GET /api/v1/analytics/kpi?range=... */}
                <Sparkline data={k.trend} color={k.color} />
              </Card>
            ))}
          </div>

          {/* ── Funnel + Sources ── */}
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }}
          >
            {/* Funnel — real from pipelineSummary */}
            <Card>
              <div className="flex items-baseline justify-between mb-4">
                <SLabel>Воронка по этапам</SLabel>
                <span className="text-[11.5px] text-muted-foreground">
                  {timeRange === "all" ? "За всё время" : `За последние ${rangeDays} дней`}
                </span>
              </div>
              <div className="flex flex-col gap-3.5">
                {funnelSteps.map((s, i) => {
                  const next = funnelSteps[i + 1];
                  const conv = next && s.v > 0 ? Math.round((next.v / s.v) * 100) : null;
                  return (
                    <div key={s.l}>
                      <div className="flex items-baseline justify-between text-[12.5px] mb-1.5">
                        <span className="font-medium text-foreground">{s.l}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {s.v}
                          {conv !== null && (
                            <span className="ml-2 text-muted-foreground/70">→ {conv}%</span>
                          )}
                        </span>
                      </div>
                      <div className="h-6 overflow-hidden rounded-[5px] border border-border bg-muted">
                        <div
                          className="h-full rounded-[4px] transition-[width] duration-500"
                          style={{
                            width: `${Math.max(s.w, 2)}%`,
                            background: s.c,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Sources — placeholder, no platform field in Firebase */}
            <Card>
              <SLabel>Источники заявок</SLabel>
              {/* TODO(backend-migration): platform field not tracked in current Firebase schema
                  Needs GET /api/v1/analytics/sources — see doc-backend/Аналитика_backend.md */}
              <div className="flex flex-col items-center justify-center h-[160px] gap-2 text-center">
                <ArrowUpRight className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground leading-snug">
                  Данные появятся после подключения бэкенда
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Поле <code className="font-mono">platform</code> не отслеживается в Firebase
                </p>
              </div>
            </Card>
          </div>

          {/* ── Weekly activity + Loss breakdown ── */}
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}
          >
            {/* Weekly bars — real from matchesAll grouped by ISO week */}
            <Card>
              <SLabel>Активность по неделям</SLabel>
              <div className="mt-6 pr-1.5">
                <BarChart
                  data={weeklyChartData.data}
                  labels={weeklyChartData.labels}
                  height={180}
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-3.5 border-t border-border text-[11.5px] text-muted-foreground">
                <span>
                  <strong className="text-foreground font-medium">
                    {weeklyChartData.data.reduce((a, b) => a + b, 0)}
                  </strong>{" "}
                  заявок за период
                </span>
                {weeklyChartData.data.some((x) => x > 0) && (
                  <span>
                    · медиана —{" "}
                    {Math.round(
                      weeklyChartData.data.reduce((a, b) => a + b, 0) /
                        Math.max(weeklyChartData.data.filter((x) => x > 0).length, 1),
                    )}{" "}
                    в неделю
                  </span>
                )}
              </div>
            </Card>

            {/* Loss breakdown — real from statusHistory + pipelineSummary */}
            <Card>
              <SLabel>Где теряются заявки</SLabel>
              <div className="flex flex-col mt-3.5">
                {lossBreakdown.map((s) => (
                  <div
                    key={s.l}
                    className="flex items-baseline justify-between py-2.5 border-b border-border last:border-b-0"
                  >
                    <span className="text-[12.5px] text-foreground">{s.l}</span>
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {s.v} · {s.p}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 rounded-[8px] border border-border bg-muted/50 p-3 text-[12px] leading-[1.6] text-muted-foreground">
                <strong className="text-foreground font-medium">Инсайт:</strong> {insightText}
              </div>
            </Card>
          </div>

          {/* ── Existing trend / insights / radar (real Firebase data) ── */}
          <DashboardTrendsCard
            matches={chartMatches}
            range={range}
            mode={mode}
            customRange={customRange}
            onRangeChange={setRange}
            onModeChange={setMode}
            onCustomRangeChange={setCustomRange}
          />

          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <DashboardInsightsCard matches={filteredMatches} />
            <DashboardStatusRadarCard matches={filteredMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalyticsPage;
