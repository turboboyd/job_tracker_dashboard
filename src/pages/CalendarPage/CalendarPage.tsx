import { CalendarDays, ChevronLeft, ChevronRight, Link, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthSelectors } from "src/entities/auth";
import {
  queryAllActiveApplications,
  type ApplicationDoc,
} from "src/features/applications/firestoreApplications";
import { db } from "src/shared/config/firebase/firebase";
import { toMillis } from "src/shared/lib/firestore/toMillis";

// ─── Event types ──────────────────────────────────────────────────────────────

type EventTone = "accent" | "info" | "warning" | "neutral";

type CalEvent = {
  id: string;
  dateKey: string; // "YYYY-MM-DD"
  time: string;    // "HH:MM" or "—"
  label: string;
  tone: EventTone;
  appId?: string;
};

// ─── Tone colors ──────────────────────────────────────────────────────────────

const TONE_BG: Record<EventTone, string> = {
  accent:  "color-mix(in oklab, var(--primary) 16%, transparent)",
  info:    "color-mix(in oklab, #6366f1 16%, transparent)",
  warning: "color-mix(in oklab, rgb(218,113,38) 16%, transparent)",
  neutral: "hsl(var(--muted))",
};
const TONE_FG: Record<EventTone, string> = {
  accent:  "var(--primary)",
  info:    "#6366f1",
  warning: "rgb(180,83,9)",
  neutral: "hsl(var(--muted-foreground))",
};
const TONE_DOT: Record<EventTone, string> = {
  accent:  "var(--primary)",
  info:    "#6366f1",
  warning: "rgb(218,113,38)",
  neutral: "hsl(var(--muted-foreground))",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeStr(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Mon=0 … Sun=6 (Russian week ordering) */
function dayOfWeekMon(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Map ApplicationDoc rows → CalEvent[] */
function deriveEvents(rows: Array<{ id: string; data: ApplicationDoc }>): CalEvent[] {
  const events: CalEvent[] = [];

  for (const { id, data } of rows) {
    const company = data.job.companyName || "—";
    const role = data.job.roleTitle || "";
    const label = role ? `${role} · ${company}` : company;
    const status = data.process.status;

    // 1. nextActionAt — highest priority explicit scheduled event
    if (data.process.nextActionAt) {
      const ms = toMillis(data.process.nextActionAt);
      if (ms) {
        const tone: EventTone =
          status === "INTERVIEW_1" || status === "INTERVIEW_2" ? "accent"
          : status === "TEST_TASK" ? "info"
          : "neutral";
        events.push({
          id: `${id}_next`,
          dateKey: toDateKey(ms),
          time: toTimeStr(ms),
          label: data.process.nextActionText || label,
          tone,
          appId: id,
        });
      }
    }

    // 2. followUpDueAt — follow-up deadline
    if (data.process.followUpDueAt) {
      const ms = toMillis(data.process.followUpDueAt);
      if (ms) {
        events.push({
          id: `${id}_followup`,
          dateKey: toDateKey(ms),
          time: "—",
          label: `Follow-up · ${company}`,
          tone: "warning",
          appId: id,
        });
      }
    }

    // 3. Status-based events — derive from lastStatusChangeAt
    if (!data.process.nextActionAt) {
      const ms = toMillis(data.process.lastStatusChangeAt);
      if (ms) {
        if (status === "INTERVIEW_1") {
          events.push({
            id: `${id}_iv1`,
            dateKey: toDateKey(ms),
            time: toTimeStr(ms),
            label: `HR · ${company}`,
            tone: "accent",
            appId: id,
          });
        } else if (status === "INTERVIEW_2") {
          events.push({
            id: `${id}_iv2`,
            dateKey: toDateKey(ms),
            time: toTimeStr(ms),
            label: `Тех · ${company}`,
            tone: "info",
            appId: id,
          });
        } else if (status === "TEST_TASK") {
          events.push({
            id: `${id}_test`,
            dateKey: toDateKey(ms),
            time: "—",
            label: `Тестовое · ${company}`,
            tone: "warning",
            appId: id,
          });
        }
      }
    }
  }

  return events;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-subtle-foreground">
      {children}
    </p>
  );
}

// ─── Event chip ───────────────────────────────────────────────────────────────

function EventChip({ event, onClick }: { event: CalEvent; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      title={event.label}
      className="cursor-pointer truncate rounded-[3px] px-[5px] py-[2px] text-[10.5px] font-medium leading-[1.4]"
      style={{
        background: TONE_BG[event.tone],
        color: TONE_FG[event.tone],
      }}
    >
      {event.time !== "—" && (
        <span className="mr-1 tabular-nums">{event.time}</span>
      )}
      {event.label}
    </div>
  );
}

// ─── View toggle ──────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
const VIEW_LABELS: { key: ViewMode; label: string }[] = [
  { key: "day",   label: "День" },
  { key: "week",  label: "Неделя" },
  { key: "month", label: "Месяц" },
];

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex gap-0 rounded-[7px] border border-border bg-muted/50 p-0.5">
      {VIEW_LABELS.map(({ key, label }) => (
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

// ─── Russian month names ──────────────────────────────────────────────────────

const RU_MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const RU_MONTHS_GEN = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];
const DOW_LABELS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

// ─── Month grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  today,
  eventsByDate,
}: {
  year: number;
  month: number;
  today: Date;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const firstDay = new Date(year, month, 1);
  const startOffset = dayOfWeekMon(firstDay); // 0=Mon … 6=Sun
  const totalDays = daysInMonth(year, month);
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

  const todayKey = toDateKey(today.getTime());

  const cells: Array<{ dayNum: number; inMonth: boolean; dateKey: string | null }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const inMonth = dayNum >= 1 && dayNum <= totalDays;
    const dateKey = inMonth
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
      : null;
    cells.push({ dayNum, inMonth, dateKey });
  }

  return (
    <>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1">
        {cells.map((c, i) => {
          const isToday = c.dateKey === todayKey;
          const events = c.dateKey ? (eventsByDate.get(c.dateKey) ?? []) : [];
          const isLastRow = i >= cells.length - 7;
          const isLastCol = (i + 1) % 7 === 0;

          return (
            <div
              key={i}
              className="relative flex flex-col gap-0.5"
              style={{
                minHeight: 96,
                padding: 6,
                borderRight: isLastCol ? "none" : "1px solid hsl(var(--border))",
                borderBottom: isLastRow ? "none" : "1px solid hsl(var(--border))",
                background: c.inMonth ? undefined : "hsl(var(--muted)/0.4)",
                opacity: c.inMonth ? 1 : 0.5,
              }}
            >
              {/* Day number */}
              <div
                className="mb-0.5 inline-flex h-[22px] min-w-[22px] items-center justify-center self-start rounded-full text-[12px] tabular-nums"
                style={{
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? "white" : "hsl(var(--muted-foreground))",
                  background: isToday ? "var(--primary)" : "transparent",
                  paddingInline: isToday ? 4 : 0,
                }}
              >
                {c.inMonth ? c.dayNum : ""}
              </div>

              {/* Events */}
              {events.slice(0, 3).map((e) => (
                <EventChip key={e.id} event={e} />
              ))}
              {events.length > 3 && (
                <span className="text-[10px] text-subtle-foreground">
                  +{events.length - 3} ещё
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Upcoming events sidebar ──────────────────────────────────────────────────

function UpcomingEvents({
  today,
  events,
}: {
  today: Date;
  events: CalEvent[];
}) {
  const todayKey = toDateKey(today.getTime());

  const todayEvents = events.filter((e) => e.dateKey === todayKey);
  const upcoming = events
    .filter((e) => e.dateKey >= todayKey)
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
      if (a.time === "—") return 1;
      if (b.time === "—") return -1;
      return a.time < b.time ? -1 : 1;
    })
    .slice(0, 8);

  const todayLabel = `Сегодня · ${today.getDate()} ${RU_MONTHS_GEN[today.getMonth()]}`;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Today card */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <SLabel>{todayLabel}</SLabel>
        {todayEvents.length === 0 ? (
          <div className="mt-3.5 rounded-[7px] border border-border bg-muted/50 p-3.5 text-center">
            <p className="text-[12.5px] text-muted-foreground">Свободный день</p>
            <p className="mt-1 text-[11px] text-subtle-foreground">
              Хорошее время для подготовки к интервью
            </p>
          </div>
        ) : (
          <div className="mt-3.5 flex flex-col gap-2">
            {todayEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2.5 rounded-[7px] border border-border p-2.5"
                style={{ background: TONE_BG[e.tone] }}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: TONE_DOT[e.tone] }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12.5px] font-medium"
                    style={{ color: TONE_FG[e.tone] }}
                  >
                    {e.label}
                  </p>
                  {e.time !== "—" && (
                    <p className="text-[11px] tabular-nums" style={{ color: TONE_FG[e.tone], opacity: 0.7 }}>
                      {e.time}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming list */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <SLabel>Ближайшие события</SLabel>
        {upcoming.length === 0 ? (
          <p className="mt-3.5 text-[12.5px] text-muted-foreground">
            Нет запланированных событий
          </p>
        ) : (
          <div className="mt-3.5 flex flex-col gap-0">
            {upcoming.map((e, i) => {
              const d = new Date(e.dateKey);
              const day = d.getDate();
              const mon = RU_MONTHS_GEN[d.getMonth()];
              return (
                <div
                  key={e.id}
                  className="flex cursor-pointer gap-3 py-2.5"
                  style={{
                    borderBottom: i < upcoming.length - 1
                      ? "1px solid hsl(var(--border))"
                      : "none",
                  }}
                >
                  {/* Date badge */}
                  <div
                    className="w-9 shrink-0 rounded-[5px] py-1 text-center"
                    style={{
                      background: TONE_BG[e.tone],
                      color: TONE_FG[e.tone],
                    }}
                  >
                    <div className="text-[14px] font-semibold leading-none tabular-nums">
                      {day}
                    </div>
                    <div className="mt-0.5 text-[9px] uppercase">
                      {mon.slice(0, 3)}
                    </div>
                  </div>

                  {/* Label */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-[1.3]">
                      {e.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle-foreground tabular-nums">
                      {e.time !== "—" ? `${e.time} · ` : ""}{day} {mon}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TODO(backend-migration): manual events + iCal sync → POST /api/v1/calendar/events */}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const { userId, isAuthReady } = useAuthSelectors();
  const [today] = useState(() => new Date());

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth()); // 0-indexed

  // ── Load applications from Firestore ──────────────────────────────────────
  const [rows, setRows] = useState<Array<{ id: string; data: ApplicationDoc }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    let cancelled = false;
    setIsLoading(true);
    queryAllActiveApplications(db, userId, 500)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        // ignore errors silently — calendar shows empty state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthReady, userId]);

  // ── Derive calendar events ─────────────────────────────────────────────────
  const allEvents = useMemo(() => deriveEvents(rows), [rows]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of allEvents) {
      const arr = map.get(e.dateKey) ?? [];
      arr.push(e);
      map.set(e.dateKey, arr);
    }
    return map;
  }, [allEvents]);

  // ── Month navigation ───────────────────────────────────────────────────────
  function prevMonth() {
    if (curMonth === 0) { setCurMonth(11); setCurYear((y) => y - 1); }
    else setCurMonth((m) => m - 1);
  }
  function nextMonth() {
    if (curMonth === 11) { setCurMonth(0); setCurYear((y) => y + 1); }
    else setCurMonth((m) => m + 1);
  }

  const monthLabel = `${RU_MONTHS[curMonth]} ${curYear}`;

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
                <span className="text-muted-foreground">Воркспейс</span>
                <span>/</span>
                <span className="text-muted-foreground">Календарь</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                Календарь
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Все интервью, дедлайны и встречи по заявкам в одном месте.
              </p>
            </div>

            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              {/* TODO(backend-migration): iCal sync → GET /api/v1/calendar/ical-feed */}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Link className="h-3.5 w-3.5 text-muted-foreground" />
                Sync iCal
              </button>
              {/* TODO(backend-migration): create manual event → POST /api/v1/calendar/events */}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background transition-opacity hover:opacity-80"
              >
                <Plus className="h-3.5 w-3.5" />
                Создать событие
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto bg-background p-7">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-muted-foreground">
            Загрузка…
          </div>
        ) : (
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "minmax(0, 1fr) 300px" }}
          >
            {/* ── Main calendar card ── */}
            <div className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
              {/* Calendar top bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="ml-1.5 text-[16px] font-semibold tracking-[-0.015em]">
                    {monthLabel}
                  </span>
                </div>

                {/* Legend */}
                <div className="flex gap-3.5 text-[11px] text-subtle-foreground">
                  {[
                    { l: "Интервью", c: "var(--primary)" },
                    { l: "Тех",      c: "#6366f1" },
                    { l: "Дедлайн", c: "rgb(218,113,38)" },
                  ].map(({ l, c }) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ background: c }}
                      />
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Month grid */}
              <div className="flex flex-1 flex-col">
                {viewMode === "month" && (
                  <MonthGrid
                    year={curYear}
                    month={curMonth}
                    today={today}
                    eventsByDate={eventsByDate}
                  />
                )}
                {viewMode !== "month" && (
                  <div className="flex flex-1 items-center justify-center py-16 text-[13px] text-muted-foreground">
                    <div className="text-center">
                      <CalendarDays className="mx-auto mb-3 h-8 w-8 text-subtle-foreground" />
                      <p className="font-medium text-foreground">
                        {viewMode === "day" ? "Вид по дням" : "Вид по неделям"}
                      </p>
                      <p className="mt-1 text-subtle-foreground text-[12px]">
                        {/* TODO(backend-migration): day/week views → GET /api/v1/calendar/events */}
                        Будет доступно после подключения бэкенда
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <UpcomingEvents today={today} events={allEvents} />
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
