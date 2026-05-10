import { ArrowUpRight, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { toMillis } from "src/shared/lib/firestore/toMillis";
import { Button } from "src/shared/ui";

import { useDashboardData } from "src/pages/DashboardPage/model/useDashboardData";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Severity = "critical" | "high" | "medium" | "low";

interface InsightAction {
  l: string;
  primary: boolean;
  href: string;
}

interface Insight {
  id: string;
  severity: Severity;
  impact: string;
  area: string;
  title: string;
  body: string;
  actions: InsightAction[];
}

const SEV: Record<
  Severity,
  { bg: string; soft: string; label: string }
> = {
  critical: {
    bg: "rgb(220,38,38)",
    soft: "color-mix(in oklab, rgb(220,38,38) 14%, transparent)",
    label: "Критично",
  },
  high: {
    bg: "rgb(218,113,38)",
    soft: "color-mix(in oklab, rgb(218,113,38) 14%, transparent)",
    label: "Высокий",
  },
  medium: {
    bg: "var(--primary)",
    soft: "color-mix(in oklab, var(--primary) 14%, transparent)",
    label: "Средний",
  },
  low: {
    bg: "hsl(var(--muted-foreground))",
    soft: "hsl(var(--muted))",
    label: "Низкий",
  },
};

const STATIC_INSIGHTS: Insight[] = [
  {
    id: "calendar-interviews",
    severity: "high",
    impact: "+15%",
    area: "Активность",
    title: "Добавь запланированные интервью в календарь",
    body: 'Используй поле «Следующее действие» в заявке, чтобы события появились в Календаре и ты не пропустил важный звонок.',
    actions: [
      { l: "Открыть календарь", primary: true, href: "/dashboard/calendar" },
    ],
  },
  {
    id: "sync-calendar",
    severity: "low",
    impact: "+5%",
    area: "Профиль",
    title: "Синхронизируй Google Calendar",
    body: "Подключи Calendar для автоматических напоминаний о встречах.",
    actions: [
      { l: "Подключить", primary: true, href: "/dashboard/calendar" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MatchLike = {
  id: string;
  status?: unknown;
  updatedAt?: unknown;
  company?: string | null;
  title?: string | null;
};

function computeScore(
  replyRate: number,
  interviewRate: number,
  hasMatches: boolean,
): number {
  return Math.min(
    100,
    22 +
      (replyRate > 0 ? 20 : 0) +
      (interviewRate > 0 ? 15 : 0) +
      (hasMatches ? 10 : 0),
  );
}

function buildInsights(staleCount: number): Insight[] {
  const insights: Insight[] = [...STATIC_INSIGHTS];

  if (staleCount > 0) {
    insights.splice(1, 0, {
      id: "stale-followup",
      severity: "medium",
      impact: "+8%",
      area: "Воронка",
      title: `Пора сделать follow-up по ${staleCount} ${staleCount === 1 ? "заявке" : "заявкам"}`,
      body: `${staleCount} ${staleCount === 1 ? "заявка не обновлялась" : "заявок не обновлялись"} более 14 дней. Напомни о себе работодателю — короткий follow-up повышает шанс ответа.`,
      actions: [
        { l: "Открыть заявки", primary: true, href: "/dashboard/applications" },
      ],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DonutChart({ score }: { score: number }) {
  const circumference = 264; // 2π*r ≈ 2π*42
  const filled = (score / 100) * circumference;
  const label =
    score >= 80 ? "Отлично" : score >= 50 ? "Можно лучше" : "Нужно работать";

  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* background track */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        {/* progress */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          transform="rotate(-90 50 50)"
        />
        {/* score text */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fontWeight="700"
          fill="currentColor"
          className="text-foreground"
        >
          {score}
        </text>
        <text
          x="50"
          y="64"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="currentColor"
          className="text-muted-foreground"
          opacity="0.7"
        >
          / 100
        </text>
      </svg>
      <div>
        <div className="text-[11.5px] text-muted-foreground mb-0.5">
          Качество поиска
        </div>
        <div className="text-[15px] font-semibold text-foreground">{label}</div>
        <div className="text-[12px] text-muted-foreground mt-1 max-w-[180px]">
          Заполни профиль и добавь больше заявок, чтобы поднять балл.
        </div>
      </div>
    </div>
  );
}

function ScoreStatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <div className="text-[11.5px] text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();
  const s = SEV[insight.severity];

  return (
    <div className="flex rounded-lg border border-border bg-card overflow-hidden">
      {/* Accent bar */}
      <div
        className="w-1.5 shrink-0"
        style={{ background: s.bg }}
      />

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ background: s.soft, color: s.bg }}
          >
            {s.label}
          </span>
          <span className="text-[12px] text-muted-foreground">
            · {insight.area}
          </span>
          <span className="text-[12px] font-medium text-emerald-600">
            · потенциал {insight.impact}
          </span>
        </div>

        {/* Title */}
        <div className="text-[15px] font-semibold text-foreground mb-1.5">
          {insight.title}
        </div>

        {/* Body */}
        <p className="text-[13px] text-muted-foreground max-w-[760px] leading-relaxed mb-3">
          {insight.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {insight.actions.map((a) => (
            <Button
              key={a.l}
              size="sm"
              variant={a.primary ? "default" : "outline"}
              onClick={() => navigate(a.href)}
            >
              {a.l}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OptimizationPage() {
  const { matchesAll, pipelineSummary, hasMatches } = useDashboardData();

  const total = pipelineSummary.total;
  const interviewed = pipelineSummary.byColumn["INTERVIEW"] ?? 0;
  const inactive =
    (pipelineSummary.byColumn["REJECTED"] ?? 0) +
    (pipelineSummary.byColumn["NO_RESPONSE"] ?? 0) +
    (pipelineSummary.byColumn["ARCHIVED"] ?? 0);
  const replied = Math.max(0, total - inactive);

  const replyRate = total > 0 ? replied / total : 0;
  const interviewRate = total > 0 ? interviewed / total : 0;

  const score = useMemo(
    () => computeScore(replyRate, interviewRate, hasMatches),
    [replyRate, interviewRate, hasMatches],
  );

  const staleCount = useMemo(() => {
    return (matchesAll as MatchLike[]).filter((m) => {
      const s = m.status as string;
      if (s !== "ACTIVE" && s !== "APPLIED") return false;
      const ms = toMillis(m.updatedAt) ?? 0;
      return ms > 0 && Date.now() - ms > 14 * 86400000;
    }).length;
  }, [matchesAll]);

  const insights = useMemo(() => buildInsights(staleCount), [staleCount]);

  // TODO(backend-migration): Real optimization score and insights from GET /api/v1/optimization/insights

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="mb-1 text-[11.5px] text-muted-foreground">
          Loopboard{" "}
          <span className="mx-1 text-border">/</span>
          Воркспейс{" "}
          <span className="mx-1 text-border">/</span>
          <span className="text-foreground">Оптимизация</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Оптимизация поиска
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Точечные улучшения, которые увеличивают шанс оффера. Отсортированы
              по влиянию.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm">
              Перепроверить
            </Button>
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Применить топ-3
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-6">
        {/* Section 1: Score row */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {/* Donut card (span 2) */}
          <div
            className="rounded-lg border border-border bg-card px-6 py-5"
            style={{ gridColumn: "span 2" }}
          >
            <DonutChart score={score} />
          </div>

          {/* Recommendations count */}
          <ScoreStatCard
            label="Рекомендаций"
            value={insights.length}
            sub="найдено улучшений"
          />

          {/* Applied this week */}
          <ScoreStatCard
            label="Применено за неделю"
            value="—"
            sub="нет данных"
          />
        </div>

        {/* Section 2: Insights */}
        <div>
          <div className="mb-3 text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
            Рекомендации
          </div>
          <div className="flex flex-col gap-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ArrowUpRight className="h-3 w-3" />
          <span>
            Данные обновляются при каждом изменении заявок.
          </span>
        </div>
      </div>
    </div>
  );
}
