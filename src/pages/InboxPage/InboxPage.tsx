import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import type { ApplicationDoc } from "src/features/applications";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import { db } from "src/shared/config/firebase/firebase";
import { getErrorMessage } from "src/shared/lib";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InboxItem {
  id: string;
  company: string;
  role: string;
  status: string;
  actionText: string | null;
  actionMs: number;
  bucket: "overdue" | "today" | "week" | "stale";
  updatedMs: number;
}

type InboxBucket = "overdue" | "today" | "week" | "stale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Date.parse(value);
    return Number.isFinite(n) ? n : 0;
  }
  const s = (value as { seconds?: unknown })?.seconds;
  return typeof s === "number" ? s * 1000 : 0;
}

function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function statusLabel(raw: unknown): string {
  const s = String(raw ?? "");
  const MAP: Record<string, string> = {
    SAVED: "Сохранено", ACTIVE: "Активно", APPLIED: "Откликнулся",
    INTERVIEW_1: "Интервью", INTERVIEW_2: "2-е интервью", TEST_TASK: "Тест. задание",
    OFFER: "Оффер", HIRED: "Принят", REJECTED: "Отказ", NO_RESPONSE: "Нет ответа",
  };
  return MAP[s] ?? s;
}

function statusColor(raw: unknown): string {
  const s = String(raw ?? "");
  if (s === "OFFER" || s === "HIRED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
  if (s.startsWith("INTERVIEW") || s === "TEST_TASK") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
  }
  if (s === "REJECTED") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
  return "bg-muted text-muted-foreground";
}

function relativeTime(ms: number, nowMs: number): string {
  const diff = nowMs - ms;
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / 86400000);
  if (absDiff < 3600000) return "только что";
  if (days === 0) return "сегодня";
  if (days === 1) return diff > 0 ? "вчера" : "завтра";
  if (days < 7) return diff > 0 ? `${days} дн. назад` : `через ${days} дн.`;
  return new Date(ms).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function actionNoun(n: number): string {
  if (n === 1) return "действие";
  if (n < 5) return "действия";
  return "действий";
}

const STALE_MS = 14 * 86400000;
const WEEK_MS = 7 * 86400000;
const ACTIVE_STATUSES = new Set(["ACTIVE", "APPLIED", "SAVED", "INTERVIEW_1", "INTERVIEW_2", "TEST_TASK"]);

function getActionBucket(
  actionMs: number,
  todayStart: number,
): InboxBucket | null {
  if (actionMs < todayStart) return "overdue";
  if (actionMs < todayStart + 86400000) return "today";
  if (actionMs < todayStart + WEEK_MS) return "week";
  return null;
}

function buildInboxItems(
  rows: Array<{ id: string; data: ApplicationDoc }>,
  nowMs: number,
): InboxItem[] {
  const todayStart = dayStart(nowMs);
  const items: InboxItem[] = [];

  for (const { id, data } of rows) {
    const company = data.job?.companyName || "—";
    const role = data.job?.roleTitle || "";
    const status = String(data.process?.subStatus ?? data.process?.status ?? "");
    const updatedMs = toMs(data.updatedAt);
    const actionMs = toMs(data.process?.nextActionAt);
    const actionText = data.process?.nextActionText ?? null;

    if (actionMs > 0) {
      const bucket = getActionBucket(actionMs, todayStart);
      if (!bucket) continue;
      items.push({ id, company, role, status, actionText, actionMs, bucket, updatedMs });
      continue;
    }

    if (ACTIVE_STATUSES.has(status) && updatedMs > 0 && nowMs - updatedMs > STALE_MS) {
      items.push({ id, company, role, status, actionText: null, actionMs: updatedMs, bucket: "stale", updatedMs });
    }
  }

  return items;
}

// ─── InboxCard ────────────────────────────────────────────────────────────────

const BUCKET_META: Record<InboxBucket, { label: string; color: string }> = {
  overdue: { label: "Просрочено",              color: "text-red-600" },
  today:   { label: "Сегодня",                 color: "text-amber-600" },
  week:    { label: "Ближайшие 7 дней",        color: "text-foreground" },
  stale:   { label: "Нет активности > 14 дней",color: "text-muted-foreground" },
};

function InboxCard({
  item,
  nowMs,
  onOpen,
}: {
  item: InboxItem;
  nowMs: number;
  onOpen: (id: string) => void;
}) {
  const avatar = (item.company || "?").charAt(0).toUpperCase();
  const timeLabel = item.bucket === "stale"
    ? `Обновлено ${relativeTime(item.updatedMs, nowMs)}`
    : relativeTime(item.actionMs, nowMs);
  const actionLabel = item.actionText
    ?? (item.bucket === "stale" ? "Нет активности — отправь follow-up" : "Запланировано действие");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(item.id); }}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/30 focus:outline-none"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-muted text-[13px] font-semibold text-foreground select-none">
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[13.5px] font-medium text-foreground">{item.company}</span>
          {item.role ? (
            <span className="truncate text-[12px] text-muted-foreground">{item.role}</span>
          ) : null}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${statusColor(item.status)}`}>
            {statusLabel(item.status)}
          </span>
        </div>
        <div className="mt-0.5 text-[12px] text-muted-foreground truncate">{actionLabel}</div>
      </div>
      <div className="shrink-0 text-[11.5px] text-muted-foreground/70 whitespace-nowrap">{timeLabel}</div>
    </div>
  );
}

function BucketSection({
  bucket,
  items,
  nowMs,
  onOpen,
}: {
  bucket: InboxBucket;
  items: InboxItem[];
  nowMs: number;
  onOpen: (id: string) => void;
}) {
  const meta = BUCKET_META[bucket];
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider ${meta.color}`}>
        {meta.label}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground normal-case tracking-normal tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <InboxCard key={item.id} item={item} nowMs={nowMs} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components to avoid nested ternaries ─────────────────────────────────

function InboxSubtitle({
  isLoading,
  totalCount,
  urgentCount,
}: {
  isLoading: boolean;
  totalCount: number;
  urgentCount: number;
}) {
  if (isLoading) return null;
  if (totalCount === 0) {
    return <p className="mt-1 text-[13px] text-muted-foreground">Нет активных действий</p>;
  }
  return (
    <p className="mt-1 text-[13px] text-muted-foreground">
      {totalCount} {actionNoun(totalCount)} ·{" "}
      {urgentCount > 0
        ? <span className="text-red-600 font-medium">{urgentCount} срочных</span>
        : <span className="text-emerald-600">всё в порядке</span>
      }
    </p>
  );
}

const BUCKET_ORDER: InboxBucket[] = ["overdue", "today", "week", "stale"];

function InboxBody({
  isLoading,
  error,
  totalCount,
  byBucket,
  nowMs,
  onOpen,
}: {
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  byBucket: Record<InboxBucket, InboxItem[]>;
  nowMs: number;
  onOpen: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-[8px] bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-56 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="m-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        {error}
      </div>
    );
  }
  if (totalCount === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-[14px] font-medium text-foreground">Всё готово</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground max-w-xs">
            Нет просроченных действий и стагнирующих заявок. Так держать!
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 p-6">
      {BUCKET_ORDER.filter((b) => byBucket[b].length > 0).map((bucket) => (
        <BucketSection
          key={bucket}
          bucket={bucket}
          items={byBucket[bucket]}
          nowMs={nowMs}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

// ─── InboxPage ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const navigate = useNavigate();
  const { userId, isAuthReady } = useAuthSelectors();
  const [nowMs] = useState(() => Date.now());
  const [rows, setRows] = useState<Array<{ id: string; data: ApplicationDoc }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repo] = useState(() => createApplicationsRepo(db));

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const data = await repo.queryAllActiveApplications(userId, 500);
        if (!cancelled) { setRows(data); setIsLoading(false); }
      } catch (err: unknown) {
        if (!cancelled) { setError(getErrorMessage(err)); setIsLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthReady, repo, userId]);

  const items = useMemo(() => buildInboxItems(rows, nowMs), [rows, nowMs]);

  const byBucket = useMemo(() => {
    const map: Record<InboxBucket, InboxItem[]> = { overdue: [], today: [], week: [], stale: [] };
    for (const item of items) map[item.bucket].push(item);
    for (const bucket of Object.keys(map) as InboxBucket[]) {
      map[bucket].sort((a, b) => a.actionMs - b.actionMs);
    }
    return map;
  }, [items]);

  const totalCount = items.length;
  const urgentCount = byBucket.overdue.length + byBucket.today.length;

  function openApplication(appId: string) {
    navigate(`${RoutePath[AppRoutes.APPLICATION_DETAILS]}`.replace(":appId", appId));
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-7 pt-5 pb-4">
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground/60 mb-1">
          <span>Loopboard</span>
          <span>/</span>
          <span className="text-muted-foreground">Inbox</span>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
          Inbox
        </h1>
        <InboxSubtitle isLoading={isLoading} totalCount={totalCount} urgentCount={urgentCount} />
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <InboxBody
          isLoading={isLoading}
          error={error}
          totalCount={totalCount}
          byBucket={byBucket}
          nowMs={nowMs}
          onOpen={openApplication}
        />
      </div>
    </div>
  );
}
