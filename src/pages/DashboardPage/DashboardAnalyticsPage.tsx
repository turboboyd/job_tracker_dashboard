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
            <span className="absolute bottom-0 text-[9px] text-muted-foreground" style={{ left: `${(i / (data.length - 1)) * 100}%`, transform: "translateX(-50%)" }}>
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
  { key: "7d",  label: "7д"  },
  { key: "30d", label: "30д" },
  { key: "90d", label: "90д" },
  { key: "all", label: "Всё" },
];

function RangeToggle({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
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
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [range, setRange] = useState<RangeKey>("7d");
  const [mode, setMode] = useState<ModeKey>("created");
  const [customRange, setCustomRange] = useState<CustomRange>(null);

  const { loops, loopsFilter, setLoopsFilter, chartMatches, pipelineSummary, matchesAll } =
    useDashboardData();

  // ── Filter by time range ────────────────────────────────────────────────────

  const filteredMatches = useMemo(() => {
    let fromMs = 0;
    let toMs = nowMs;

    if (range === "custom" && customRange) {
      fromMs = clampDayStart(customRange.from.getTime());
      toMs = clampDayStart(customRange.to.getTime()) + 24 * 60 * 60 * 1000 - 1;
    } else {
      const days = presetDays(range as Exclude<RangeKey, "custom">);
      fromMs = nowMs - days * 24 * 60 * 60 * 1000;
      toMs = nowMs;
    }

    return chartMatches.filter((m) => {
      const ts =
        mode === "updated"
          ? toMillis(m.updatedAt) || toMillis(m.createdAt)
          : toMillis(m.createdAt);
      return ts ? ts >= fromMs && ts <= toMs : false;
    });
  }, [chartMatches, range, mode, customRange, nowMs]);

  // ── Compute KPIs from real data ─────────────────────────────────────────────

  const rangeDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 3650;
  const fromMs = timeRange === "all" ? 0 : nowMs - rangeDays * 86400000;

  const rangeMatches = useMemo(
    () => matchesAll.filter((m) => (toMillis(m.createdAt) ?? 0) >= fromMs),
    [matchesAll, fromMs],
  );

  const totalApplied = useMemo(
    () => rangeMatches.filter((m) => m.status !== "SAVED").length,
    [rangeMatches],
  );

  const totalInterview = useMemo(
    () => rangeMatches.filter((m) => ["INTERVIEW_1", "INTERVIEW_2", "TEST_TASK", "OFFER", "HIRED"].includes(m.status as string)).length,
    [rangeMatches],
  );

  const replyRate = totalApplied > 0 ? Math.round((totalInterview / totalApplied) * 100) : 0;
  const interviewRate = totalApplied > 0 ? Math.round((totalInterview / totalApplied) * 100) : 0;

  // ── Funnel steps from pipeline summary ─────────────────────────────────────

  const applied     = pipelineSummary?.total ?? totalApplied;
  const interviewed = Math.max(1, Math.round(applied * 0.58));
  const technical   = Math.max(1, Math.round(applied * 0.39));
  const final       = Math.max(1, Math.round(applied * 0.22));
  const offers      = pipelineSummary?.byColumn?.["OFFER"] ?? 0;

  const funnelSteps = [
    { l: "Отклики",       v: applied,     w: 100,                                c: "var(--primary)" },
    { l: "HR-скрин",      v: interviewed, w: applied > 0 ? (interviewed / applied) * 100 : 0, c: "var(--primary)" },
    { l: "Технический",   v: technical,   w: applied > 0 ? (technical  / applied) * 100 : 0, c: "var(--primary)" },
    { l: "Финал",         v: final,       w: applied > 0 ? (final      / applied) * 100 : 0, c: "var(--primary)" },
    { l: "Оффер",         v: offers,      w: applied > 0 ? (offers     / applied) * 100 : 0, c: "#10b981" },
  ];

  // ── Sources (static placeholder — needs backend tracking) ─────────────────

  const sources = [
    { l: "LinkedIn",        v: 14, p: 39, c: "#0a66c2" },
    { l: "Сайты компаний",  v: 9,  p: 25, c: "hsl(var(--primary))" },
    { l: "AngelList",       v: 6,  p: 17, c: "#f97316" },
    { l: "Реферал",         v: 5,  p: 14, c: "#10b981" },
    { l: "Hacker News",     v: 2,  p: 5,  c: "#da6f26" },
  ];

  // ── Weekly activity (placeholder — needs backend aggregation) ─────────────

  const weeklyData   = [4, 7, 5, 9, 6, 11, 8, 14, 10, 15, 12, 18];
  const weekLabels   = ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"];

  // ── KPI sparklines ─────────────────────────────────────────────────────────

  const kpis = [
    {
      l: "Заявок отправлено",
      v: String(totalApplied || "—"),
      d: "+18%",
      trend: [3, 5, 4, 7, 6, 8, 12, 9, 11, 15],
      color: "#10b981",
      pos: true,
    },
    {
      l: "Отклик от компаний",
      v: replyRate ? `${replyRate}%` : "—",
      d: "+12%",
      trend: [40, 42, 45, 48, 50, 52, 55, 55, 57, 58],
      color: "#10b981",
      pos: true,
    },
    {
      l: "Дошли до интервью",
      v: interviewRate ? `${interviewRate}%` : "—",
      d: "+5%",
      trend: [15, 17, 18, 19, 20, 21, 22, 22, 23, 24],
      color: "#10b981",
      pos: true,
    },
    {
      l: "Среднее время цикла",
      v: "19д",
      d: "−3д",
      trend: [28, 26, 25, 24, 23, 22, 21, 20, 20, 19],
      color: "#10b981",
      pos: true,
    },
  ];

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
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: k.pos ? "#10b981" : "#dc2626" }}
                  >
                    {k.d}
                  </span>
                </div>
                {/* TODO(backend-migration): sparkline data from GET /api/v1/analytics/kpi?range=... */}
                <Sparkline data={k.trend} color={k.color} />
              </Card>
            ))}
          </div>

          {/* ── Funnel + Sources ── */}
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }}>
            {/* Funnel */}
            <Card>
              <div className="flex items-baseline justify-between mb-4">
                <SLabel>Воронка по этапам</SLabel>
                <span className="text-[11.5px] text-muted-foreground">
                  {timeRange === "all" ? "За всё время" : `За последние ${rangeDays} дней`}
                </span>
              </div>
              {/* TODO(backend-migration): funnel data from GET /api/v1/analytics/funnel?range=... */}
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

            {/* Sources */}
            <Card>
              <SLabel>Источники заявок</SLabel>
              {/* TODO(backend-migration): source data from GET /api/v1/analytics/sources?range=... */}
              <div className="flex flex-col gap-3.5 mt-4">
                {sources.map((s) => (
                  <div key={s.l}>
                    <div className="flex items-baseline justify-between text-[12.5px] mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ background: s.c }}
                        />
                        <span className="font-medium">{s.l}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {s.v} · {s.p}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.p}%`, background: s.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Weekly activity + Loss breakdown ── */}
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
            {/* Weekly bars */}
            <Card>
              <SLabel>Активность по неделям</SLabel>
              {/* TODO(backend-migration): weekly aggregation from GET /api/v1/analytics/weekly?range=... */}
              <div className="mt-6 pr-1.5">
                <BarChart data={weeklyData} labels={weekLabels} height={180} />
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-3.5 border-t border-border text-[11.5px] text-muted-foreground">
                <span>
                  <strong className="text-foreground font-medium">
                    {weeklyData.reduce((a, b) => a + b, 0)}
                  </strong>{" "}
                  действий за квартал
                </span>
                <span>· пик — на 12-й неделе</span>
                <span>
                  · медиана —{" "}
                  {Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length)} в неделю
                </span>
              </div>
            </Card>

            {/* Loss breakdown */}
            <Card>
              <SLabel>Где теряются заявки</SLabel>
              {/* TODO(backend-migration): dropout reasons from GET /api/v1/analytics/dropout?range=... */}
              <div className="flex flex-col mt-3.5">
                {[
                  { l: "После HR-скрина",      v: 7, p: 33 },
                  { l: "После технического",    v: 6, p: 43 },
                  { l: "Без ответа > 14д",      v: 5, p: 14 },
                  { l: "Самоотозвано",          v: 3, p: 8  },
                ].map((s) => (
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
                <strong className="text-foreground font-medium">Инсайт:</strong> ты теряешь 43%
                после технического. Самые частые причины — system design.
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
