import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Eye,
  FileText,
  Mail,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  UserPlus,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { toMillis } from "src/shared/lib/firestore/toMillis";
import { Button } from "src/shared/ui";

import { useDashboardData } from "./model/useDashboardData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityType =
  | "view"
  | "match"
  | "loop"
  | "system"
  | "note"
  | "message"
  | "file"
  | "apply"
  | "move"
  | "interview"
  | "contact";

type FilterKey = "all" | "apply" | "interview" | "match" | "loop" | "note";

interface ActivityItem {
  id: string;
  timeMs: number;
  time: string;
  who: string;
  action: string;
  target: string;
  type: ActivityType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Всё" },
  { key: "apply", label: "Отклики" },
  { key: "interview", label: "Интервью" },
  { key: "match", label: "Матчи" },
  { key: "loop", label: "Циклы" },
  { key: "note", label: "Заметки" },
];

const ACT_ICONS: Record<ActivityType, { icon: React.ReactNode; color: string }> = {
  view:      { icon: <Eye className="h-3.5 w-3.5" />,          color: "hsl(var(--muted-foreground))" },
  match:     { icon: <Sparkles className="h-3.5 w-3.5" />,     color: "var(--primary)" },
  loop:      { icon: <RefreshCw className="h-3.5 w-3.5" />,    color: "#6366f1" },
  system:    { icon: <Bell className="h-3.5 w-3.5" />,         color: "hsl(var(--muted-foreground))" },
  note:      { icon: <Pencil className="h-3.5 w-3.5" />,       color: "hsl(var(--muted-foreground))" },
  message:   { icon: <Mail className="h-3.5 w-3.5" />,         color: "#6366f1" },
  file:      { icon: <FileText className="h-3.5 w-3.5" />,     color: "hsl(var(--muted-foreground))" },
  apply:     { icon: <Send className="h-3.5 w-3.5" />,         color: "#10b981" },
  move:      { icon: <ArrowUpRight className="h-3.5 w-3.5" />, color: "var(--primary)" },
  interview: { icon: <CalendarDays className="h-3.5 w-3.5" />, color: "var(--primary)" },
  contact:   { icon: <UserPlus className="h-3.5 w-3.5" />,     color: "#10b981" },
};

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

function deriveActivity(matches: MatchLike[]): ActivityItem[] {
  return [...matches]
    .filter((m) => toMillis(m.updatedAt) > 0)
    .sort((a, b) => (toMillis(b.updatedAt) ?? 0) - (toMillis(a.updatedAt) ?? 0))
    .map((m) => {
      const status = m.status as string;
      const company = m.company ?? "—";
      const role = m.title ?? "";
      const target = role ? `${company} · ${role}` : company;

      const type: ActivityType =
        ["INTERVIEW_1", "INTERVIEW_2"].includes(status)
          ? "interview"
          : status === "TEST_TASK"
          ? "note"
          : status === "OFFER" || status === "HIRED"
          ? "match"
          : status === "REJECTED" || status === "NO_RESPONSE"
          ? "system"
          : "apply";

      const action =
        type === "interview"
          ? "прошёл интервью"
          : type === "match"
          ? "получил оффер от"
          : type === "system"
          ? "получил отказ от"
          : "обновил статус в";

      const timeMs = toMillis(m.updatedAt) ?? 0;

      return {
        id: m.id,
        timeMs,
        time: new Date(timeMs).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        who: "Ты",
        action,
        target,
        type,
      };
    });
}

function groupByDay(
  items: ActivityItem[],
  nowMs: number,
): { d: string; items: ActivityItem[] }[] {
  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const groups = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const d = new Date(item.timeMs);
    d.setHours(0, 0, 0, 0);
    let key: string;
    if (d.getTime() === today.getTime()) key = "Сегодня";
    else if (d.getTime() === yesterday.getTime()) key = "Вчера";
    else
      key = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  return [...groups.entries()].map(([d, its]) => ({ d, items: its }));
}

function computeStreak(
  matches: MatchLike[],
): { streak: number; activeDays: Set<number> } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeDays = new Set(
    matches.map((m) => {
      const d = new Date(toMillis(m.updatedAt) ?? 0);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  let streak = 0;
  for (let i = 0; i < 21; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    if (activeDays.has(d.getTime())) streak++;
    else break;
  }

  return { streak, activeDays };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DayGroupHeader({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em]">
      <span>{label}</span>
      <span className="flex-1 h-px bg-border" />
      <span>{count}</span>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = ACT_ICONS[item.type] ?? ACT_ICONS.apply;

  return (
    <div className="grid grid-cols-[56px_32px_1fr] gap-3.5 py-3 px-4 items-start border-b border-border last:border-b-0">
      {/* Time */}
      <span className="text-[11.5px] text-muted-foreground tabular-nums pt-[5px]">
        {item.time}
      </span>

      {/* Icon */}
      <div
        className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center"
        style={{ color: meta.color }}
      >
        {meta.icon}
      </div>

      {/* Text */}
      <p className="text-[13px] leading-[1.5] pt-[2px] text-foreground">
        <strong>{item.who}</strong>{" "}
        <span className="text-muted-foreground">{item.action}</span>{" "}
        <span className="border-b border-dashed border-muted-foreground/50 cursor-pointer hover:text-foreground transition-colors">
          {item.target}
        </span>
      </p>
    </div>
  );
}

function StatRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-[12.5px] text-muted-foreground truncate">
        {label}
      </span>
      <span className="text-[12.5px] font-medium tabular-nums w-6 text-right">
        {count}
      </span>
      <div className="w-20 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardActivityPage() {
  const navigate = useNavigate();
  const { matchesAll } = useDashboardData();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const nowMs = Date.now();

  const allActivity = useMemo(() => deriveActivity(matchesAll), [matchesAll]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return allActivity;
    return allActivity.filter((a) => a.type === activeFilter);
  }, [allActivity, activeFilter]);

  const groups = useMemo(() => groupByDay(filtered, nowMs), [filtered, nowMs]);

  // Stats for last 7 days
  const sevenDaysAgo = nowMs - 7 * 86400000;
  const last7 = allActivity.filter((a) => a.timeMs >= sevenDaysAgo);
  const stats7 = {
    total: last7.length,
    apply: last7.filter((a) => a.type === "apply").length,
    interview: last7.filter((a) => a.type === "interview").length,
    match: last7.filter((a) => a.type === "match").length,
  };
  const stats7Max = Math.max(stats7.apply, stats7.interview, stats7.match, 1);

  // Streak
  const { streak, activeDays } = useMemo(
    () => computeStreak(matchesAll),
    [matchesAll],
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TODO(backend-migration): Real activity log needs GET /api/v1/activity/feed
  // Current data is derived from matchesAll.updatedAt as a proxy.

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="mb-1 text-[11.5px] text-muted-foreground">
          Loopboard{" "}
          <span className="mx-1 text-border">/</span>
          Воркспейс{" "}
          <span className="mx-1 text-border">/</span>
          <span className="text-foreground">Активность</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Активность
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Вся история действий по поиску — твоих и системных.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm">
              Фильтры
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              Экспорт лога
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex gap-3.5 flex-wrap items-start">
          {/* ── Left: filter sidebar ── */}
          <div
            className="shrink-0 rounded-lg border border-border bg-card overflow-hidden"
            style={{ width: 180 }}
          >
            <div className="px-3 py-2.5 border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Фильтр
            </div>
            <div className="flex flex-col py-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className={[
                    "flex items-center justify-between px-3 py-2 text-[13px] transition-colors text-left",
                    activeFilter === f.key
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  ].join(" ")}
                >
                  <span>{f.label}</span>
                  {activeFilter === f.key && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Center: activity feed ── */}
          <div className="flex-1 min-w-[360px]">
            {groups.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-[13px] text-muted-foreground">
                Нет событий для выбранного фильтра.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {groups.map((g) => (
                  <div key={g.d}>
                    <DayGroupHeader label={g.d} count={g.items.length} />
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                      {g.items.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: stats sidebar ── */}
          <div
            className="flex-1 min-w-[260px] max-w-[340px] flex flex-col gap-3"
          >
            {/* Card 1: За 7 дней */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                За 7 дней
              </div>
              <div className="flex flex-col gap-2.5">
                <StatRow
                  label="Всего событий"
                  count={stats7.total}
                  max={stats7.total || 1}
                />
                <StatRow
                  label="Откликов"
                  count={stats7.apply}
                  max={stats7Max}
                />
                <StatRow
                  label="Интервью"
                  count={stats7.interview}
                  max={stats7Max}
                />
                <StatRow
                  label="Матчей"
                  count={stats7.match}
                  max={stats7Max}
                />
              </div>
            </div>

            {/* Card 2: Серия */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Серия
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-foreground tabular-nums">
                  {streak}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {streak === 1 ? "день подряд" : streak >= 2 && streak <= 4 ? "дня подряд" : "дней подряд"}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Активность за последние 21 день
              </p>
              {/* 21 squares */}
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 21 }).map((_, i) => {
                  const dayMs = today.getTime() - (20 - i) * 86400000;
                  const isActive = activeDays.has(dayMs);
                  return (
                    <div
                      key={i}
                      title={new Date(dayMs).toLocaleDateString("ru-RU")}
                      className={[
                        "h-4 w-4 rounded-sm",
                        isActive ? "bg-primary" : "bg-muted",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick link */}
            <button
              type="button"
              onClick={() => navigate(RoutePath[AppRoutes.APPLICATIONS])}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors text-left px-1"
            >
              → Открыть все заявки
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
