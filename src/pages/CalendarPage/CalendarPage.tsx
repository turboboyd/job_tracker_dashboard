import { ChevronLeft, ChevronRight, Link2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthSelectors } from "src/entities/auth";
import {
  createApplicationsRepo,
  type ApplicationDoc,
} from "src/features/applications";
import { db } from "src/shared/config/firebase/firebase";
import { toMillis } from "src/shared/lib/firestore/toMillis";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventTone = "accent" | "info" | "warning" | "neutral";

type CalEvent = {
  id: string;
  dateKey: string; // "YYYY-MM-DD"
  time: string;    // "HH:MM" or "—"
  label: string;
  tone: EventTone;
  appId?: string;
};

type ViewMode = "day" | "week" | "month";

// ─── Tone tokens ──────────────────────────────────────────────────────────────

const TONE_BG: Record<EventTone, string> = {
  accent:  "color-mix(in oklab, var(--primary) 18%, transparent)",
  info:    "color-mix(in oklab, #7c3aed 18%, transparent)",
  warning: "color-mix(in oklab, rgb(218,113,38) 18%, transparent)",
  neutral: "hsl(var(--muted))",
};

const TONE_FG: Record<EventTone, string> = {
  accent:  "var(--primary)",
  info:    "#7c3aed",
  warning: "rgb(180,83,9)",
  neutral: "hsl(var(--muted-foreground))",
};

const LEGEND = [
  { label: "Интервью", tone: "accent"  as EventTone },
  { label: "Тех",      tone: "info"    as EventTone },
  { label: "Дедлайн",  tone: "warning" as EventTone },
];

// ─── Locale constants ─────────────────────────────────────────────────────────

const RU_MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const RU_MONTHS_GEN = [
  "янв","фев","мар","апр","мая","июн",
  "июл","авг","сен","окт","ноя","дек",
];
const RU_MONTHS_GEN_FULL = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];
const RU_MONTHS_SHORT_UP = [
  "ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН",
  "ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК",
];
const DOW = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DOW_FULL = [
  "Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье",
];

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: "day",   label: "День"   },
  { key: "week",  label: "Неделя" },
  { key: "month", label: "Месяц"  },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function toTimeStr(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/** Mon=0…Sun=6 */
function dowMon(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekStart(d: Date): Date {
  const result = new Date(d);
  result.setDate(d.getDate() - dowMon(d));
  result.setHours(0, 0, 0, 0);
  return result;
}

type WeekDay = { dateKey: string; dayNum: number; month: number; dow: number };

function getWeekDays(weekStart: Date): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { dateKey: toDateKey(d.getTime()), dayNum: d.getDate(), month: d.getMonth(), dow: i };
  });
}

// ─── Event derivation ─────────────────────────────────────────────────────────

function toneForStatus(status: string): EventTone {
  if (status === "INTERVIEW_1" || status === "INTERVIEW_2") return "accent";
  if (status === "TEST_TASK") return "info";
  return "neutral";
}

function deriveNextActionEvent(id: string, data: ApplicationDoc, company: string, role: string): CalEvent | null {
  if (!data.process.nextActionAt) return null;
  const ms = toMillis(data.process.nextActionAt);
  if (!ms) return null;
  return {
    id: `${id}_next`,
    dateKey: toDateKey(ms),
    time: toTimeStr(ms),
    label: data.process.nextActionText || (role ? `${role} · ${company}` : company),
    tone: toneForStatus(data.process.status),
    appId: id,
  };
}

function deriveFollowUpEvent(id: string, data: ApplicationDoc, company: string): CalEvent | null {
  if (!data.process.followUpDueAt) return null;
  const ms = toMillis(data.process.followUpDueAt);
  if (!ms) return null;
  return { id: `${id}_fu`, dateKey: toDateKey(ms), time: "—", label: `Follow-up · ${company}`, tone: "warning", appId: id };
}

function deriveStatusProxyEvent(id: string, data: ApplicationDoc, company: string): CalEvent | null {
  if (data.process.nextActionAt) return null;
  const ms = toMillis(data.process.lastStatusChangeAt);
  if (!ms) return null;
  const status = data.process.status;
  if (status === "INTERVIEW_1") return { id: `${id}_iv1`, dateKey: toDateKey(ms), time: toTimeStr(ms), label: `HR · ${company}`, tone: "accent", appId: id };
  if (status === "INTERVIEW_2") return { id: `${id}_iv2`, dateKey: toDateKey(ms), time: toTimeStr(ms), label: `Тех · ${company}`, tone: "info", appId: id };
  if (status === "TEST_TASK")   return { id: `${id}_tt`,  dateKey: toDateKey(ms), time: "—",            label: `Тестовое · ${company}`, tone: "warning", appId: id };
  return null;
}

function deriveEvents(rows: Array<{ id: string; data: ApplicationDoc }>): CalEvent[] {
  const events: CalEvent[] = [];
  for (const { id, data } of rows) {
    const company = data.job.companyName || "—";
    const role    = data.job.roleTitle   || "";
    const next  = deriveNextActionEvent(id, data, company, role);
    const fu    = deriveFollowUpEvent(id, data, company);
    const proxy = deriveStatusProxyEvent(id, data, company);
    if (next)  events.push(next);
    if (fu)    events.push(fu);
    if (proxy) events.push(proxy);
  }
  return events;
}

// ─── ViewToggle ───────────────────────────────────────────────────────────────

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex gap-0 rounded-[7px] border border-border bg-muted p-0.5">
      {VIEWS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={[
            "rounded-[5px] px-2.5 py-1 text-[12px] transition-colors",
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

// ─── EventChip ────────────────────────────────────────────────────────────────

function EventChip({ event, compact = false }: { event: CalEvent; compact?: boolean }) {
  return (
    <div
      title={event.label}
      className={[
        "rounded-[4px] font-medium leading-snug cursor-pointer overflow-hidden",
        compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-1 text-[10.5px]",
      ].join(" ")}
      style={{ background: TONE_BG[event.tone], color: TONE_FG[event.tone] }}
    >
      {event.time !== "—" && (
        <div className="tabular-nums opacity-75 mb-0.5" style={{ fontSize: compact ? 9 : 9.5 }}>
          {event.time}
        </div>
      )}
      <div className="truncate">{event.label}</div>
    </div>
  );
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  todayKey,
  eventsByDate,
}: {
  year: number;
  month: number;
  todayKey: string;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const firstDay  = new Date(year, month, 1);
  const offset    = dowMon(firstDay);
  const total     = daysInMonth(year, month);
  const cellCount = Math.ceil((offset + total) / 7) * 7;

  type Cell = { dayNum: number; inMonth: boolean; dateKey: string | null };
  const cells: Cell[] = Array.from({ length: cellCount }, (_, i) => {
    const dayNum  = i - offset + 1;
    const inMonth = dayNum >= 1 && dayNum <= total;
    return {
      dayNum,
      inMonth,
      dateKey: inMonth
        ? `${year}-${String(month + 1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`
        : null,
    };
  });

  return (
    <>
      <div className="grid grid-cols-7 border-b border-border">
        {DOW.map((d) => (
          <div key={d} className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {cells.map((c, i) => {
          const isToday   = c.dateKey === todayKey;
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= cellCount - 7;
          const events    = c.dateKey ? (eventsByDate.get(c.dateKey) ?? []) : [];

          return (
            <div
              key={i}
              className={[
                "min-h-[96px] p-1.5 relative",
                !isLastCol ? "border-r border-border" : "",
                !isLastRow ? "border-b border-border" : "",
                !c.inMonth ? "bg-muted/40 opacity-50" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[12px] mb-1 px-1 tabular-nums",
                  isToday ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground",
                ].join(" ")}
              >
                {c.inMonth ? c.dayNum : ""}
              </div>
              <div className="flex flex-col gap-0.5">
                {events.slice(0, 3).map((e) => <EventChip key={e.id} event={e} compact />)}
                {events.length > 3 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">+{events.length - 3} ещё</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

function WeekGrid({
  weekDays,
  todayKey,
  eventsByDate,
}: {
  weekDays: WeekDay[];
  todayKey: string;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  return (
    <div className="flex flex-col flex-1">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/20">
        {weekDays.map((day) => (
          <div
            key={day.dateKey}
            className="flex flex-col items-center gap-1 py-3 border-r border-border last:border-r-0"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {DOW[day.dow]}
            </span>
            <span
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums",
                day.dateKey === todayKey
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground",
              ].join(" ")}
            >
              {day.dayNum}
            </span>
          </div>
        ))}
      </div>
      {/* Event columns */}
      <div className="grid grid-cols-7 divide-x divide-border flex-1 overflow-y-auto" style={{ minHeight: 220 }}>
        {weekDays.map((day) => {
          const events  = eventsByDate.get(day.dateKey) ?? [];
          const isToday = day.dateKey === todayKey;
          return (
            <div
              key={day.dateKey}
              className={["p-2 flex flex-col gap-1.5", isToday ? "bg-primary/[0.03]" : ""].join(" ")}
            >
              {events.length === 0 ? (
                <div className="mt-8 text-center text-[11px] text-muted-foreground/40">—</div>
              ) : (
                events.map((e) => <EventChip key={e.id} event={e} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

function DayView({
  refDate,
  todayKey,
  eventsByDate,
}: {
  refDate: Date;
  todayKey: string;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const dateKey  = toDateKey(refDate.getTime());
  const events   = eventsByDate.get(dateKey) ?? [];
  const isToday  = dateKey === todayKey;
  const dow      = dowMon(refDate);
  const dayLabel = `${DOW_FULL[dow]}, ${refDate.getDate()} ${RU_MONTHS_GEN_FULL[refDate.getMonth()]} ${refDate.getFullYear()}`;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] font-bold tabular-nums",
            isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          ].join(" ")}
        >
          {refDate.getDate()}
        </div>
        <div>
          <div className="text-[16px] font-semibold tracking-[-0.015em] text-foreground">{dayLabel}</div>
          <div className="text-[12px] text-muted-foreground">
            {events.length === 0 ? "Нет запланированных событий" : `${events.length} событий`}
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-card px-6 py-10 text-center">
          <div className="text-[22px] mb-2">📅</div>
          <div className="text-[13.5px] font-medium text-foreground">Свободный день</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            Хорошее время для подготовки к интервью или отправки follow-up
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3.5 rounded-[12px] border border-border bg-card px-4 py-3.5"
              style={{ borderLeftWidth: 3, borderLeftColor: TONE_FG[e.tone] }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[11.5px] font-bold tabular-nums"
                style={{ background: TONE_BG[e.tone], color: TONE_FG[e.tone] }}
              >
                {e.time !== "—" ? e.time.split(":")[0] : "—"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-foreground leading-tight">{e.label}</div>
                {e.time !== "—" && (
                  <div className="mt-0.5 text-[12px] text-muted-foreground tabular-nums">{e.time}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TodayCard ────────────────────────────────────────────────────────────────

function TodayCard({ today, events }: { today: Date; events: CalEvent[] }) {
  const monthFull = RU_MONTHS_GEN_FULL[today.getMonth()];
  const label = `Сегодня · ${today.getDate()} ${monthFull}`;

  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-3">{label}</div>
      {events.length === 0 ? (
        <div className="rounded-[8px] border border-border bg-muted/40 px-3 py-3 text-center">
          <div className="text-[12.5px] text-muted-foreground">Свободный день</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground/70">Хорошее время подготовиться к интервью</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-[8px] px-3 py-2.5"
              style={{ background: TONE_BG[e.tone], border: `1px solid ${TONE_FG[e.tone]}22` }}
            >
              <div className="text-[12.5px] font-medium leading-snug" style={{ color: TONE_FG[e.tone] }}>
                {e.label}
              </div>
              {e.time !== "—" && (
                <div className="mt-0.5 text-[11px] tabular-nums" style={{ color: TONE_FG[e.tone], opacity: 0.8 }}>
                  {e.time}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UpcomingCard ─────────────────────────────────────────────────────────────

function UpcomingCard({ todayKey, events }: { todayKey: string; events: CalEvent[] }) {
  const upcoming = events
    .filter((e) => e.dateKey >= todayKey)
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
      if (a.time === "—") return 1;
      if (b.time === "—") return -1;
      return a.time < b.time ? -1 : 1;
    })
    .slice(0, 8);

  return (
    <div className="rounded-[14px] border border-border bg-card p-4 flex-1">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-3">
        Ближайшие события
      </div>
      {upcoming.length === 0 ? (
        <div className="text-[12.5px] text-muted-foreground">Нет запланированных событий</div>
      ) : (
        <div className="flex flex-col">
          {upcoming.map((e, i) => {
            const d       = new Date(e.dateKey);
            const day     = d.getDate();
            const mon     = RU_MONTHS_SHORT_UP[d.getMonth()];
            const monFull = RU_MONTHS_GEN_FULL[d.getMonth()];
            return (
              <div
                key={e.id}
                className={[
                  "flex gap-3 py-2.5 items-start cursor-pointer",
                  i < upcoming.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <div
                  className="w-9 shrink-0 rounded-[5px] py-1 text-center"
                  style={{ background: TONE_BG[e.tone], color: TONE_FG[e.tone] }}
                >
                  <div className="text-[14px] font-semibold leading-none tabular-nums">{day}</div>
                  <div className="text-[9px] mt-0.5">{mon}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-snug text-foreground">{e.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {e.time !== "—" && <>{e.time} · </>}{day} {monFull}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const { userId, isAuthReady } = useAuthSelectors();

  const [today]    = useState(() => new Date());
  const todayKey   = toDateKey(today.getTime());

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [refDate,  setRefDate]  = useState(() => new Date());

  const repo = useMemo(() => createApplicationsRepo(db), []);
  const [rows, setRows]       = useState<Array<{ id: string; data: ApplicationDoc }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await repo.queryAllActiveApplications(userId, 500);
        if (!cancelled) { setRows(data); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthReady, repo, userId]);

  const allEvents    = useMemo(() => deriveEvents(rows), [rows]);
  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of allEvents) {
      const arr = m.get(e.dateKey) ?? [];
      arr.push(e);
      m.set(e.dateKey, arr);
    }
    return m;
  }, [allEvents]);

  const todayEvents = eventsByDate.get(todayKey) ?? [];

  // ── Navigation ────────────────────────────────────────────────────────────

  function prevPeriod() {
    setRefDate((d) => {
      const next = new Date(d);
      if (viewMode === "month") { next.setDate(1); next.setMonth(d.getMonth() - 1); }
      else if (viewMode === "week") next.setDate(d.getDate() - 7);
      else next.setDate(d.getDate() - 1);
      return next;
    });
  }

  function nextPeriod() {
    setRefDate((d) => {
      const next = new Date(d);
      if (viewMode === "month") { next.setDate(1); next.setMonth(d.getMonth() + 1); }
      else if (viewMode === "week") next.setDate(d.getDate() + 7);
      else next.setDate(d.getDate() + 1);
      return next;
    });
  }

  function goToToday() {
    setRefDate(new Date());
  }

  // ── Derived display values ────────────────────────────────────────────────

  const weekStart = useMemo(() => getWeekStart(refDate), [refDate]);
  const weekDays  = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + 6);
    return d;
  }, [weekStart]);

  const periodLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${RU_MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}`;
    }
    if (viewMode === "week") {
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getDate()}–${weekEnd.getDate()} ${RU_MONTHS_GEN_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
      }
      return `${weekStart.getDate()} ${RU_MONTHS_GEN[weekStart.getMonth()]} – ${weekEnd.getDate()} ${RU_MONTHS_GEN[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    }
    const dow = dowMon(refDate);
    return `${DOW_FULL[dow]}, ${refDate.getDate()} ${RU_MONTHS_GEN_FULL[refDate.getMonth()]} ${refDate.getFullYear()}`;
  }, [viewMode, refDate, weekStart, weekEnd]);

  // ── Calendar grid view ────────────────────────────────────────────────────

  const calendarGrid = useMemo(() => {
    if (viewMode === "month") {
      return (
        <MonthGrid
          year={refDate.getFullYear()}
          month={refDate.getMonth()}
          todayKey={todayKey}
          eventsByDate={eventsByDate}
        />
      );
    }
    if (viewMode === "week") {
      return <WeekGrid weekDays={weekDays} todayKey={todayKey} eventsByDate={eventsByDate} />;
    }
    return <DayView refDate={refDate} todayKey={todayKey} eventsByDate={eventsByDate} />;
  }, [viewMode, refDate, todayKey, eventsByDate, weekDays]);

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
                <span className="text-muted-foreground">Календарь</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                Календарь
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Интервью, дедлайны и follow-up по всем заявкам в одном месте.
              </p>
            </div>
            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Sync iCal
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                Создать событие
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-muted-foreground">
            Загрузка…
          </div>
        ) : (
          <div className="grid h-full" style={{ gridTemplateColumns: "minmax(0, 1fr) 300px" }}>

            {/* ── Main calendar card ── */}
            <div className="flex flex-col overflow-hidden border-r border-border">
              {/* Month/week nav bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevPeriod}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPeriod}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="ml-1 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                    {periodLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-[12px] font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    Сегодня
                  </button>
                  {viewMode === "month" && (
                    <div className="flex gap-3.5 text-[11px] text-muted-foreground">
                      {LEGEND.map(({ label, tone }) => (
                        <span key={label} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-[2px] shrink-0" style={{ background: TONE_FG[tone] }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid area */}
              <div className="flex flex-col flex-1 overflow-hidden">
                {calendarGrid}
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="flex flex-col gap-3.5 p-4 overflow-y-auto">
              <TodayCard today={today} events={todayEvents} />
              <UpcomingCard todayKey={todayKey} events={allEvents} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
