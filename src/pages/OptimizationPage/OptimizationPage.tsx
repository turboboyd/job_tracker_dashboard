import { RefreshCw, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useDashboardData } from "src/pages/DashboardPage/model/useDashboardData";
import { toMillis } from "src/shared/lib/firestore/toMillis";


// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";

type InsightAction = {
  label: string;
  primary: boolean;
  href: string;
};

type Insight = {
  id: string;
  severity: Severity;
  impact: string;
  area: string;
  title: string;
  body: string;
  actions: InsightAction[];
};

// ─── Severity colors ──────────────────────────────────────────────────────────

const SEV: Record<Severity, { bar: string; badgeBg: string; badgeFg: string; label: string }> = {
  critical: {
    bar:     "rgb(220,38,38)",
    badgeBg: "color-mix(in oklab, rgb(220,38,38) 14%, transparent)",
    badgeFg: "rgb(220,38,38)",
    label:   "Критично",
  },
  high: {
    bar:     "rgb(218,113,38)",
    badgeBg: "color-mix(in oklab, rgb(218,113,38) 14%, transparent)",
    badgeFg: "rgb(180,83,9)",
    label:   "Высокий",
  },
  medium: {
    bar:     "var(--primary)",
    badgeBg: "color-mix(in oklab, var(--primary) 14%, transparent)",
    badgeFg: "var(--primary)",
    label:   "Средний",
  },
  low: {
    bar:     "hsl(var(--muted-foreground))",
    badgeBg: "hsl(var(--muted))",
    badgeFg: "hsl(var(--muted-foreground))",
    label:   "Низкий",
  },
};

// ─── Static insights ──────────────────────────────────────────────────────────

const STATIC_INSIGHTS: Insight[] = [
  {
    id: "calendar",
    severity: "high",
    impact: "+15%",
    area: "Активность",
    title: "Добавь запланированные интервью в календарь",
    body: "Используй поле «Следующее действие» в заявке — события автоматически появятся в Календаре и ты не пропустишь важный звонок.",
    actions: [
      { label: "Открыть календарь", primary: true, href: "/dashboard/calendar" },
    ],
  },
  {
    id: "gcal",
    severity: "low",
    impact: "+5%",
    area: "Интеграции",
    title: "Синхронизируй Google Calendar",
    body: "Подключи Calendar для автоматических напоминаний о встречах и дедлайнах прямо в твоём календаре.",
    actions: [
      { label: "Подключить", primary: true, href: "/dashboard/calendar" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInsights(staleCount: number, totalApplied: number): Insight[] {
  const out: Insight[] = [...STATIC_INSIGHTS];

  if (staleCount > 0) {
    out.splice(0, 0, {
      id: "stale-followup",
      severity: "medium",
      impact: "+8%",
      area: "Воронка",
      title: `Пора сделать follow-up по ${staleCount} ${staleCount === 1 ? "заявке" : "заявкам"}`,
      body: `${staleCount} ${staleCount === 1 ? "заявка не обновлялась" : "заявок не обновлялись"} более 14 дней. Напомни о себе — короткий follow-up повышает шанс ответа на 20–30%.`,
      actions: [
        { label: "Открыть заявки", primary: true, href: "/dashboard/applications" },
      ],
    });
  }

  if (totalApplied === 0) {
    out.splice(0, 0, {
      id: "no-applications",
      severity: "critical",
      impact: "+40%",
      area: "Заявки",
      title: "Нет активных заявок — начни поиск прямо сейчас",
      body: "Создай направление поиска или добавь заявку вручную, чтобы отслеживать прогресс и получать рекомендации.",
      actions: [
        { label: "Добавить заявку", primary: true, href: "/dashboard/applications" },
        { label: "Создать направление", primary: false, href: "/dashboard/loops" },
      ],
    });
  }

  return out;
}

function computeScore(replyRate: number, interviewRate: number, hasMatches: boolean): number {
  return Math.min(
    100,
    22 +
    (hasMatches ? 10 : 0) +
    Math.round(replyRate * 40) +
    Math.round(interviewRate * 28),
  );
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Отлично";
  if (score >= 55) return "Хороший прогресс";
  if (score >= 35) return "Можно лучше";
  return "Нужна работа";
}

// ─── Helpers label ─────────────────────────────────────────────────────────────

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-subtle-foreground">
      {children}
    </p>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r; // ≈ 263.9
  const filled = (score / 100) * circ;
  const label = scoreLabel(score);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* SVG donut */}
      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg
          viewBox="0 0 100 100"
          style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}
        >
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
          />
        </svg>
        {/* centered text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-semibold tracking-[-0.04em] leading-none tabular-nums text-foreground">
            {score}
          </span>
          <span className="text-[10px] text-subtle-foreground mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <SLabel>Качество поиска</SLabel>
        <div className="text-[18px] font-semibold tracking-[-0.02em] mt-1.5">{label}</div>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-[1.6] max-w-[340px]">
          Применение всех рекомендаций ниже даёт прогноз{" "}
          <strong className="text-foreground">+{Math.min(78, (100 - score))}%</strong>{" "}
          к шансу оффера за следующие 30 дней.
        </p>
      </div>
    </div>
  );
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card px-5 py-4">
      <SLabel>{label}</SLabel>
      <div className="text-[30px] font-semibold tracking-[-0.025em] mt-2 tabular-nums text-foreground">
        {value}
      </div>
      {sub && (
        <div className="text-[11.5px] text-subtle-foreground mt-1">{sub}</div>
      )}
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();
  const s = SEV[insight.severity];

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card flex">
      {/* Left accent bar */}
      <div className="w-1.5 shrink-0" style={{ background: s.bar }} />

      {/* Content */}
      <div className="flex-1 px-[22px] py-[18px]">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.04em] px-[7px] py-[2px] rounded-[99px]"
            style={{ background: s.badgeBg, color: s.badgeFg }}
          >
            {s.label}
          </span>
          <span className="text-[11.5px] text-subtle-foreground">
            · {insight.area}
          </span>
          <span className="text-[11.5px] font-medium" style={{ color: "rgb(5,150,105)" }}>
            · потенциал {insight.impact}
          </span>
        </div>

        {/* Title */}
        <div className="text-[15px] font-semibold tracking-[-0.015em] text-foreground mb-2">
          {insight.title}
        </div>

        {/* Body */}
        <p className="text-[13px] text-muted-foreground leading-[1.6] max-w-[760px] mb-3.5">
          {insight.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {insight.actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => navigate(a.href)}
              className={[
                "rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer",
                a.primary
                  ? "bg-foreground text-background hover:opacity-80"
                  : "border border-border bg-card text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline funnel ──────────────────────────────────────────────────────────

interface FunnelEntry {
  label: string;
  sublabel: string;
  count: number;
  pct: number;
  barClass: string;
}

function buildFunnelEntries(byColumn: Record<string, number>, total: number): FunnelEntry[] {
  const interview = (byColumn["INTERVIEW"] ?? 0) + (byColumn["OFFER"] ?? 0) + (byColumn["HIRED"] ?? 0);
  const offer     = (byColumn["OFFER"] ?? 0) + (byColumn["HIRED"] ?? 0);
  const hired     = byColumn["HIRED"] ?? 0;
  const pct       = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  return [
    { label: "Всего отправлено",  sublabel: "все заявки",           count: total,     pct: 100,         barClass: "bg-muted-foreground/25" },
    { label: "Получили ответ",    sublabel: "HR или рекрутер",       count: interview, pct: pct(interview), barClass: "bg-primary/50" },
    { label: "Дошли до интервью", sublabel: "техническое или оффер", count: offer,     pct: pct(offer),     barClass: "bg-primary/75" },
    { label: "Получили оффер",    sublabel: "конечная конверсия",    count: hired,     pct: pct(hired),     barClass: "bg-primary" },
  ];
}

function PipelineFunnel({ byColumn, total }: { byColumn: Record<string, number>; total: number }) {
  const rejected   = byColumn["REJECTED"]    ?? 0;
  const noResponse = byColumn["NO_RESPONSE"] ?? 0;
  const active     = byColumn["ACTIVE"]      ?? 0;

  if (total === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-card px-6 py-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle-foreground mb-2">
          Воронка поиска
        </div>
        <div className="text-[12.5px] text-muted-foreground">
          Добавь первые заявки, чтобы увидеть конверсию по этапам
        </div>
      </div>
    );
  }

  const entries = buildFunnelEntries(byColumn, total);

  return (
    <div className="rounded-[14px] border border-border bg-card px-6 py-5">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle-foreground">
            Воронка поиска
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            Прохождение по этапам отбора
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground justify-end">
          {active > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400/70 shrink-0" />
              В процессе: <strong className="text-foreground font-semibold ml-0.5">{active}</strong>
            </span>
          )}
          {rejected > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive/50 shrink-0" />
              Отклонено: <strong className="text-foreground font-semibold ml-0.5">{rejected}</strong>
            </span>
          )}
          {noResponse > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
              Нет ответа: <strong className="text-foreground font-semibold ml-0.5">{noResponse}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-3">
            <div className="w-[180px] shrink-0">
              <div className="text-[12.5px] font-medium text-foreground leading-tight">{entry.label}</div>
              <div className="text-[11px] text-muted-foreground">{entry.sublabel}</div>
            </div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${entry.barClass}`}
                style={{ width: `${Math.max(entry.pct, entry.count > 0 ? 2 : 0)}%` }}
              />
            </div>
            <div className="flex items-center gap-2 w-[72px] justify-end shrink-0 tabular-nums">
              <span className="text-[14px] font-semibold text-foreground">{entry.count}</span>
              <span className="text-[11px] text-muted-foreground">{entry.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OptimizationPage() {
  const { matchesAll, pipelineSummary, hasMatches } = useDashboardData();

  const total    = pipelineSummary.total;
  const replied  = (pipelineSummary.byColumn["INTERVIEW"] ?? 0)
                 + (pipelineSummary.byColumn["OFFER"]     ?? 0)
                 + (pipelineSummary.byColumn["HIRED"]     ?? 0);
  const offered  = (pipelineSummary.byColumn["OFFER"] ?? 0)
                 + (pipelineSummary.byColumn["HIRED"] ?? 0);
  const offerPct = total > 0 ? Math.round((offered / total) * 100) : 0;

  const replyRate     = total > 0 ? replied / total : 0;
  const interviewRate = total > 0 ? offered / total : 0;

  const score = useMemo(
    () => computeScore(replyRate, interviewRate, hasMatches),
    [replyRate, interviewRate, hasMatches],
  );

  const [nowMs] = useState(() => Date.now());

  // Stale applications — ACTIVE/APPLIED, not updated in 14+ days
  const staleCount = useMemo(() => {
    return matchesAll.filter((m) => {
      const s = m.status as string;
      if (s !== "ACTIVE" && s !== "APPLIED" && s !== "SAVED") return false;
      const ms = toMillis(m.updatedAt) ?? 0;
      return ms > 0 && nowMs - ms > 14 * 86_400_000;
    }).length;
  }, [matchesAll, nowMs]);

  const insights = useMemo(
    () => buildInsights(staleCount, total),
    [staleCount, total],
  );

  // Severity counts for the sub-label
  const critCount = insights.filter(i => i.severity === "critical").length;
  const highCount = insights.filter(i => i.severity === "high").length;
  const medCount  = insights.filter(i => i.severity === "medium").length;

  const sevLabel = [
    critCount > 0 && `${critCount} критичных`,
    highCount > 0 && `${highCount} высоких`,
    medCount  > 0 && `${medCount} средних`,
  ].filter(Boolean).join(" · ") || "нет критичных";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground/60 mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <span className="text-muted-foreground">Оптимизация</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                Оптимизация поиска
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Точечные улучшения, которые увеличивают шанс оффера. Отсортированы по влиянию.
              </p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                Перепроверить
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background transition-opacity hover:opacity-80"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Применить топ-3
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex flex-col gap-[18px] p-7">

          {/* ── Score row ── */}
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
          >
            {/* Donut card — span 2 */}
            <div
              className="rounded-[14px] border border-border bg-card px-6 py-5"
              style={{ gridColumn: "span 2" }}
            >
              <DonutChart score={score} />
            </div>

            {/* Рекомендаций */}
            <StatCard
              label="Рекомендаций"
              value={insights.length}
              sub={sevLabel}
            />

            {/* Конверсия в оффер */}
            <StatCard
              label="Конверсия в оффер"
              value={`${offerPct}%`}
              sub={`${offered} из ${total} заявок`}
            />
          </div>

          {/* ── Pipeline funnel ── */}
          <PipelineFunnel byColumn={pipelineSummary.byColumn} total={total} />

          {/* ── Insights list ── */}
          <div className="flex flex-col gap-2.5">
            {insights.map((ins) => (
              <InsightCard key={ins.id} insight={ins} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
