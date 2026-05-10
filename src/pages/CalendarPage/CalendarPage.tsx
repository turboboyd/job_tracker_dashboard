import { ChevronLeft, ChevronRight, Link2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthSelectors } from "src/entities/auth";
import {
  queryAllActiveApplications,
  type ApplicationDoc,
} from "src/features/applications/firestoreApplications";
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

// ─── Tone tokens (matching design vars) ──────────────────────────────────────

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

// ─── Russian locale ───────────────────────────────────────────────────────────

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

// ─── Event derivation from Firebase applications ──────────────────────────────

function deriveEvents(rows: Array<{ id: string; data: ApplicationDoc }>): CalEvent[] {
  const events: CalEvent[] = [];

  for (const { id, data } of rows) {
    const company = data.job.companyName || "—";
    const role    = data.job.roleTitle   || "";
    const status  = data.process.status;

    // 1 — explicit scheduled action (most reliable)
    if (data.process.nextActionAt) {
      const ms = toMillis(data.process.nextActionAt);
      if (ms) {
        const tone: EventTone =
          status === "INTERVIEW_1" || status === "INTERVIEW_2" ? "accent" :
          status === "TEST_TASK" ? "info" : "neutral";
        events.push({
          id: `${id}_next`,
          dateKey: toDateKey(ms),
          time: toTimeStr(ms),
          label: data.process.nextActionText || (role ? `${role} · ${company}` : company),
          tone,
          appId: id,
        });
      }
    }

    // 2 — follow-up deadline
    if (data.process.followUpDueAt) {
      const ms = toMillis(data.process.followUpDueAt);
      if (ms) {
        events.push({
          id: `${id}_fu`,
          dateKey: toDateKey(ms),
          time: "—",
          label: `Follow-up · ${company}`,
          tone: "warning",
          appId: id,
        });
      }
    }

    // 3 — status-based proxy (only if no explicit date)
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
            id: `${id}_tt`,
            dateKey: toDateKey(ms),
            time: "—",
            label: role ? `Тестовое · ${company}` : `Тестовое · ${company}`,
            tone: "warning",
            appId: id,
          });
        }
      }
    }
  }

  return events;
}

// ─── View toggle ──────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
const VIEWS: { key: ViewMode; label: string }[] = [
  { key: "day",   label: "День"   },
  { key: "week",  label: "Неделя" },
  { key: "month", label: "Месяц"  },
];

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 0,
        padding: 2,
        borderRadius: 7,
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {VIEWS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            borderRadius: 5,
            cursor: "pointer",
            background: value === key ? "hsl(var(--card))" : "transparent",
            color: value === key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            fontWeight: value === key ? 500 : 400,
            boxShadow: value === key ? "0 1px 3px rgba(0,0,0,.07)" : "none",
            border: "none",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>
      {children}
    </div>
  );
}

// ─── Month calendar grid ──────────────────────────────────────────────────────

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
  const firstDay   = new Date(year, month, 1);
  const offset     = dowMon(firstDay);           // empty cells before day 1
  const total      = daysInMonth(year, month);
  const cellCount  = Math.ceil((offset + total) / 7) * 7;

  type Cell = { dayNum: number; inMonth: boolean; dateKey: string | null };
  const cells: Cell[] = [];

  for (let i = 0; i < cellCount; i++) {
    const dayNum  = i - offset + 1;
    const inMonth = dayNum >= 1 && dayNum <= total;
    const dateKey = inMonth
      ? `${year}-${String(month + 1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`
      : null;
    cells.push({ dayNum, inMonth, dateKey });
  }

  return (
    <>
      {/* Day-of-week header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid hsl(var(--border))" }}>
        {DOW.map((d) => (
          <div key={d} style={{ padding: "8px 10px", fontSize: 11, color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Cell grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1 }}>
        {cells.map((c, i) => {
          const isToday     = c.dateKey === todayKey;
          const isLastCol   = (i + 1) % 7 === 0;
          const isLastRow   = i >= cellCount - 7;
          const events      = c.dateKey ? (eventsByDate.get(c.dateKey) ?? []) : [];

          return (
            <div
              key={i}
              style={{
                minHeight: 96,
                padding: 6,
                borderRight:  isLastCol ? "none" : "1px solid hsl(var(--border))",
                borderBottom: isLastRow ? "none" : "1px solid hsl(var(--border))",
                background:   c.inMonth ? "transparent" : "hsl(var(--muted))",
                opacity:      c.inMonth ? 1 : 0.5,
                position:     "relative",
              }}
            >
              {/* Day number */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 22,
                  height: 22,
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? "white" : "hsl(var(--muted-foreground))",
                  background: isToday ? "var(--primary)" : "transparent",
                  marginBottom: 4,
                  fontVariantNumeric: "tabular-nums",
                  paddingInline: isToday ? 4 : 0,
                }}
              >
                {c.inMonth ? c.dayNum : ""}
              </div>

              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {events.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    title={e.label}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 5px",
                      borderRadius: 3,
                      background: TONE_BG[e.tone],
                      color: TONE_FG[e.tone],
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {e.time !== "—" && (
                      <span style={{ fontVariantNumeric: "tabular-nums", marginRight: 4 }}>
                        {e.time}
                      </span>
                    )}
                    {e.label}
                  </div>
                ))}
                {events.length > 3 && (
                  <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                    +{events.length - 3} ещё
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Today card ───────────────────────────────────────────────────────────────

function TodayCard({ today, events }: { today: Date; events: CalEvent[] }) {
  const day     = today.getDate();
  const monthFull = RU_MONTHS_GEN_FULL[today.getMonth()];
  const label   = `Сегодня · ${day} ${monthFull}`;

  return (
    <div style={{ borderRadius: 14, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", padding: 18 }}>
      <SectionLabel>{label}</SectionLabel>

      {events.length === 0 ? (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 7, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, color: "hsl(var(--muted-foreground))" }}>Свободный день</div>
          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", opacity: 0.7, marginTop: 4 }}>Хорошее время подготовиться к интервью</div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: TONE_BG[e.tone],
                border: `1px solid ${TONE_FG[e.tone]}22`,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 500, color: TONE_FG[e.tone], lineHeight: 1.3 }}>{e.label}</div>
              {e.time !== "—" && (
                <div style={{ fontSize: 11, color: TONE_FG[e.tone], opacity: 0.8, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
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

// ─── Upcoming events card ─────────────────────────────────────────────────────

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
    <div style={{ borderRadius: 14, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", padding: 18, flex: 1 }}>
      <SectionLabel>Ближайшие события</SectionLabel>

      {upcoming.length === 0 ? (
        <div style={{ marginTop: 14, fontSize: 12.5, color: "hsl(var(--muted-foreground))" }}>
          Нет запланированных событий
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 1 }}>
          {upcoming.map((e, i) => {
            const d   = new Date(e.dateKey);
            const day = d.getDate();
            const mon = RU_MONTHS_SHORT_UP[d.getMonth()];
            const monFull = RU_MONTHS_GEN_FULL[d.getMonth()];

            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < upcoming.length - 1 ? "1px solid hsl(var(--border))" : "none",
                  cursor: "pointer",
                  alignItems: "flex-start",
                }}
              >
                {/* Date badge */}
                <div
                  style={{
                    width: 36,
                    flexShrink: 0,
                    textAlign: "center",
                    padding: "4px 0",
                    borderRadius: 5,
                    background: TONE_BG[e.tone],
                    color: TONE_FG[e.tone],
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {day}
                  </div>
                  <div style={{ fontSize: 9, marginTop: 2 }}>{mon}</div>
                </div>

                {/* Content */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, color: "hsl(var(--foreground))" }}>
                    {e.label}
                  </div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
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

  const [today]     = useState(() => new Date());
  const todayKey    = toDateKey(today.getTime());

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [curYear,  setCurYear]  = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());

  // ── Load from Firebase ────────────────────────────────────────────────────
  const [rows, setRows]       = useState<Array<{ id: string; data: ApplicationDoc }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    let cancelled = false;
    setLoading(true);
    queryAllActiveApplications(db, userId, 500)
      .then((data) => { if (!cancelled) setRows(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthReady, userId]);

  // ── Derive events ─────────────────────────────────────────────────────────
  const allEvents = useMemo(() => deriveEvents(rows), [rows]);

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
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Sync iCal
              </button>
              {/* TODO(backend-migration): create manual event → POST /api/v1/calendar/events */}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-80 transition-opacity"
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
        <div className="p-7">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-muted-foreground">
              Загрузка…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 14 }}>

              {/* ── Main calendar card ── */}
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Month nav bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))" }}>
                  {/* Left: nav + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      onClick={prevMonth}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <ChevronLeft style={{ width: 16, height: 16 }} />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <ChevronRight style={{ width: 16, height: 16 }} />
                    </button>
                    <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", marginLeft: 6 }}>
                      {monthLabel}
                    </span>
                  </div>

                  {/* Right: legend */}
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                    {LEGEND.map(({ label, tone }) => (
                      <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: TONE_FG[tone], flexShrink: 0 }} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid */}
                {viewMode === "month" ? (
                  <MonthGrid
                    year={curYear}
                    month={curMonth}
                    todayKey={todayKey}
                    eventsByDate={eventsByDate}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0", flexDirection: "column", gap: 8, color: "hsl(var(--muted-foreground))" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "hsl(var(--foreground))" }}>
                      {viewMode === "day" ? "Вид по дням" : "Вид по неделям"}
                    </span>
                    <span style={{ fontSize: 12 }}>
                      {/* TODO(backend-migration): GET /api/v1/calendar/events */}
                      Будет доступно после подключения бэкенда
                    </span>
                  </div>
                )}
              </div>

              {/* ── Right sidebar ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <TodayCard today={today} events={todayEvents} />
                <UpcomingCard todayKey={todayKey} events={allEvents} />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
