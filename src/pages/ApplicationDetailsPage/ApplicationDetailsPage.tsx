import {
  ArrowUpRight,
  Bookmark,
  Download,
  ChevronDown,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import {
  normalizeStatusKey,
  type StatusKey,
} from "src/entities/application/model/status";
import { StatusPill } from "src/entities/application/ui/StatusKit";
import { useAuthSelectors } from "src/entities/auth";
import type { WorkMode } from "src/features/applications/firestore/types";
import {
  type ApplicationDoc,
  type ProcessStatus,
  type HistoryEventDoc,
} from "src/features/applications/firestoreApplications";
import type { ApplicationDocument } from "src/features/applications/rest/adapter";
import {
  changeApplicationStatusViaRest,
  createApplicationCommentViaRest,
  deleteDocumentViaRest,
  downloadDocumentViaRest,
  getApplicationByIdViaRest,
  getApplicationHistoryPageViaRest,
  listApplicationDocumentsViaRest,
  updateApplicationViaRest,
  uploadApplicationDocumentViaRest,
  validateApplicationDocumentUploadFile,
  type ApplicationHistoryTypeFilter,
  type DocumentKind,
} from "src/features/applications/rest/queries";
import { ApiError } from "src/shared/api/rest/restClient";

import { getApplicationVacancyDescription } from "./applicationDetails.helpers";
import { InlineField } from "./ui/InlineField";
import { SalaryField } from "./ui/SalaryField";
import { TagsField } from "./ui/TagsField";


// ─── helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: ProcessStatus): string {
  switch (status) {
    case "SAVED":
      return "Saved";
    case "PLANNED":
      return "Planned";
    case "APPLIED":
      return "Applied";
    case "VIEWED":
      return "Viewed";
    case "INTERVIEW_1":
      return "Interview";
    case "INTERVIEW_2":
      return "Interview 2";
    case "TEST_TASK":
      return "Test task";
    case "OFFER":
      return "Offer";
    case "REJECTED":
      return "Rejected";
    case "NO_RESPONSE":
      return "No response";
    default:
      return status;
  }
}

function formatTs(ts: unknown): string {
  if (!ts) return "";
  try {
    const maybe = ts as { toDate?: unknown };
    const d =
      typeof maybe?.toDate === "function"
        ? (maybe.toDate as () => Date)()
        : new Date(ts as never);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDate(ts: unknown): string {
  if (!ts) return "";
  try {
    const maybe = ts as { toDate?: unknown };
    const d =
      typeof maybe?.toDate === "function"
        ? (maybe.toDate as () => Date)()
        : new Date(ts as never);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatIsoDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

function documentKindLabel(kind: string): string {
  switch (kind) {
    case "cv":
      return "CV";
    case "cover_letter":
      return "Cover letter";
    case "portfolio":
      return "Portfolio";
    case "other":
      return "Other";
    default:
      return kind;
  }
}

function daysAgo(ts: unknown): number {
  if (!ts) return 0;
  try {
    const maybe = ts as { toDate?: unknown };
    const d =
      typeof maybe?.toDate === "function"
        ? (maybe.toDate as () => Date)()
        : new Date(ts as never);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  } catch {
    return 0;
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function logRestError(context: string, e: unknown): void {
  if (e instanceof ApiError && e.requestId) {
    console.error(context, {
      status: e.status,
      code: e.code,
      requestId: e.requestId,
    });
  }
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ─── Stage ribbon ────────────────────────────────────────────────────────────

const STAGE_STEPS: { status: ProcessStatus; label: string }[] = [
  { status: "SAVED", label: "Сохранено" },
  { status: "APPLIED", label: "Отправлено" },
  { status: "INTERVIEW_1", label: "Интервью" },
  { status: "TEST_TASK", label: "Тест" },
  { status: "OFFER", label: "Предложение" },
];
const TERMINAL_NEG: ProcessStatus[] = ["REJECTED", "NO_RESPONSE"];

function StageRibbon({ current }: { current: ProcessStatus }) {
  const isNeg = TERMINAL_NEG.includes(current);
  const currentIdx = STAGE_STEPS.findIndex((s) => s.status === current);

  return (
    <div className="flex gap-1.5 items-center">
      {STAGE_STEPS.map((step, i) => {
        const isActive = step.status === current && !isNeg;
        const isPast = !isNeg && currentIdx > i;
        return (
          <div key={step.status} className="flex flex-col flex-1 min-w-0">
            <div
              className={[
                "h-[4px] rounded-full mb-1.5 transition-colors",
                isActive
                  ? "bg-primary"
                  : isPast
                    ? "bg-primary/50"
                    : "bg-border",
              ].join(" ")}
            />
            <div
              className={[
                "text-[11px] truncate",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              {i + 1}. {step.label}
            </div>
          </div>
        );
      })}
      {isNeg && (
        <div className="flex flex-col flex-shrink-0">
          <div className="h-[4px] rounded-full mb-1.5 bg-destructive/60" />
          <div className="text-[11px] font-medium text-destructive">
            {current === "REJECTED" ? "Отказ" : "Нет ответа"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status change dropdown ──────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProcessStatus; label: string }[] = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW_1", label: "Interview" },
  { value: "TEST_TASK", label: "Test task" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NO_RESPONSE", label: "No response" },
];

function StatusDropdown({
  current,
  onChange,
  disabled,
}: {
  current: ProcessStatus;
  onChange: (s: ProcessStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sk = normalizeStatusKey(current) as StatusKey | null;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-[7px] border border-border bg-card px-2.5 py-1 text-[12px] font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {sk ? (
          <StatusPill status={sk} className="text-[11px]" dotSize="xs" />
        ) : (
          <span>{statusLabel(current)}</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[150px] rounded-[10px] border border-border bg-card py-1 shadow-xl">
          {STATUS_OPTIONS.map((opt) => {
            const optSk = normalizeStatusKey(opt.value) as StatusKey | null;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-muted transition-colors",
                  opt.value === current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {optSk ? (
                  <StatusPill
                    status={optSk}
                    className="text-[11px]"
                    dotSize="xs"
                  />
                ) : (
                  <span>{opt.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Work mode chips ─────────────────────────────────────────────────────────

const WORK_MODE_OPTIONS: { value: WorkMode | "ANY"; label: string }[] = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
  { value: "ANY", label: "Any" },
];

function WorkModeChips({
  current,
  onSelect,
  disabled,
}: {
  current?: WorkMode;
  onSelect: (mode: WorkMode | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-2">
        Work mode
      </p>
      <div className="flex flex-wrap gap-1.5">
        {WORK_MODE_OPTIONS.map((opt) => {
          const isActive =
            opt.value === "ANY" ? current == null : current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSelect(
                  opt.value === "ANY" ? undefined : (opt.value as WorkMode),
                )
              }
              className={[
                "rounded-[6px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section label ───────────────────────────────────────────────────────────

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
      {children}
    </p>
  );
}

// ─── Match bar ───────────────────────────────────────────────────────────────

function MatchBar({ score }: { score: number }) {
  const color =
    score >= 85
      ? "bg-emerald-500"
      : score >= 70
        ? "bg-primary"
        : "bg-muted-foreground/40";
  return (
    <div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-[28px] font-semibold tracking-[-0.025em] tabular-nums">
          {score}
        </span>
        <span className="text-[13px] text-muted-foreground">/ 100</span>
      </div>
      <div className="h-[5px] bg-muted rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

// ─── History type helpers ────────────────────────────────────────────────────

function historyEventTitle(ev: HistoryEventDoc): string {
  if (ev.type === "STATUS_CHANGE")
    return `Статус: ${ev.fromStatus ?? "?"} → ${ev.toStatus ?? "?"}`;
  if (ev.type === "COMMENT") return ev.comment ?? "Комментарий";
  if (ev.type === "FIELD_CHANGE")
    return `Поле обновлено: ${ev.fieldPath ?? "?"}`;
  return ev.comment ?? "Событие";
}

function historyDot(ev: HistoryEventDoc): string {
  if (ev.type === "STATUS_CHANGE") return "bg-primary/70";
  if (ev.type === "COMMENT") return "bg-emerald-500";
  return "bg-muted-foreground/50";
}

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab =
  | "overview"
  | "description"
  | "timeline"
  | "prep"
  | "contacts"
  | "files"
  | "notes";

type HistoryTypeFilter = "ALL" | ApplicationHistoryTypeFilter;

const HISTORY_PAGE_SIZE = 20;

const HISTORY_TYPE_FILTERS: Array<{ label: string; value: HistoryTypeFilter }> = [
  { label: "Все", value: "ALL" },
  { label: "Комментарии", value: "COMMENT" },
  { label: "Статусы", value: "STATUS_CHANGE" },
  { label: "Изменения", value: "FIELD_CHANGE" },
  { label: "Документы", value: "DOCUMENT_UPLOADED" },
  { label: "Архив", value: "APPLICATION_ARCHIVED" },
];

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ApplicationDetailsPage() {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const { userId, isAuthReady } = useAuthSelectors();

  const [app, setApp] = useState<ApplicationDoc | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; data: HistoryEventDoc }>
  >([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyType, setHistoryType] = useState<HistoryTypeFilter>("ALL");
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUploadKind, setDocumentUploadKind] =
    useState<DocumentKind>("other");
  const [tab, setTab] = useState<Tab>("overview");
  const [commentText, setCommentText] = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────

  async function loadHistoryPage(nextOffset = 0, mode: "replace" | "append" = "replace") {
    if (!appId) return;
    const page = await getApplicationHistoryPageViaRest(appId, {
      limit: HISTORY_PAGE_SIZE,
      offset: nextOffset,
      type: historyType === "ALL" ? undefined : historyType,
    });
    setHistory((current) =>
      mode === "append" ? [...current, ...page.items] : page.items,
    );
    setHistoryTotal(page.total);
    setHistoryLimit(page.limit);
    setHistoryOffset(page.offset);
  }

  async function load() {
    if (!userId || !appId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [applicationRow, h, documentList] = await Promise.all([
        getApplicationByIdViaRest(userId, appId),
        getApplicationHistoryPageViaRest(appId, {
          limit: HISTORY_PAGE_SIZE,
          offset: 0,
          type: historyType === "ALL" ? undefined : historyType,
        }),
        listApplicationDocumentsViaRest(appId),
      ]);
      setApp(applicationRow.data);
      setHistory(h.items);
      setHistoryTotal(h.total);
      setHistoryLimit(h.limit);
      setHistoryOffset(h.offset);
      setDocuments(documentList.items);
      setDocumentsTotal(documentList.total);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage core load failed", e);
      setError(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthReady || !userId || !appId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, userId, appId]);

  useEffect(() => {
    if (!isAuthReady || !userId || !appId) return;
    void loadHistoryPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyType]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function onChangeStatus(next: ProcessStatus) {
    if (!userId || !appId) return;
    setIsMutating(true);
    setError(null);
    try {
      const updated = await changeApplicationStatusViaRest(userId, appId, {
        toStatus: next,
      });
      setApp(updated.data);
      await loadHistoryPage(0);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage status change failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function onAddComment() {
    const text = commentText.trim();
    if (!text || !userId || !appId) return;
    setIsMutating(true);
    setError(null);
    try {
      await createApplicationCommentViaRest(appId, text);
      setCommentText("");
      await load();
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage comment creation failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function refreshDocuments() {
    if (!appId) return;
    setIsDocumentsLoading(true);
    try {
      const documentList = await listApplicationDocumentsViaRest(appId);
      setDocuments(documentList.items);
      setDocumentsTotal(documentList.total);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage documents load failed", e);
      setError(errorMessage(e));
    } finally {
      setIsDocumentsLoading(false);
    }
  }

  async function onDownloadDocument(documentId: string) {
    setIsMutating(true);
    setError(null);
    try {
      const response = await downloadDocumentViaRest(documentId);
      const filename =
        response.filename ??
        documents.find((item) => item.id === documentId)?.originalFilename ??
        "document";
      const objectUrl = URL.createObjectURL(response.blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage document download failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function onDeleteDocument(documentId: string) {
    setIsMutating(true);
    setError(null);
    try {
      await deleteDocumentViaRest(documentId);
      setDocuments((prev) => prev.filter((item) => item.id !== documentId));
      setDocumentsTotal((prev) => Math.max(0, prev - 1));
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage document delete failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function onUploadDocument(file: File | null) {
    if (!appId || !file) return;

    const validation = validateApplicationDocumentUploadFile(file);
    if (!validation.ok) {
      setError(validation.message ?? "Файл нельзя загрузить.");
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      const uploadedDocument = await uploadApplicationDocumentViaRest(appId, {
        file,
        kind: documentUploadKind,
      });
      setDocuments((prev) => [
        uploadedDocument,
        ...prev.filter((item) => item.id !== uploadedDocument.id),
      ]);
      setDocumentsTotal((prev) => prev + 1);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage document upload failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  // ── Field save helpers ────────────────────────────────────────────────────
  // TODO(backend-migration): PATCH /api/v1/applications/:appId

  async function saveField(
    patch: Record<string, unknown>,
    fieldPath?: string,
  ): Promise<void> {
    if (!userId || !appId) return;
    try {
      const updated = await updateApplicationViaRest(userId, appId, patch);
      setApp(updated.data);
      await loadHistoryPage(0);
    } catch (e: unknown) {
      logRestError(
        `ApplicationDetailsPage field save failed: ${fieldPath ?? "unknown"}`,
        e,
      );
      throw e;
    }
  }

  async function saveWorkMode(mode: WorkMode | undefined) {
    if (!userId || !appId) return;
    setIsMutating(true);
    setError(null);
    try {
      const updated = await updateApplicationViaRest(userId, appId, {
        "job.workMode": mode ?? null,
      });
      setApp(updated.data);
      await loadHistoryPage(0);
    } catch (e: unknown) {
      logRestError("ApplicationDetailsPage work mode save failed", e);
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const days = useMemo(() => (app ? daysAgo(app.createdAt) : 0), [app]);
  const interviewCount = useMemo(
    () =>
      history.filter(
        (h) =>
          h.data.toStatus === "INTERVIEW_1" ||
          h.data.toStatus === "INTERVIEW_2",
      ).length,
    [history],
  );

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Обзор" },
    { key: "description", label: "Описание" },
    { key: "timeline", label: "Хронология", badge: history.length },
    { key: "prep", label: "Подготовка" },
    { key: "contacts", label: "Контакты" },
    { key: "files", label: "Файлы", badge: documentsTotal || undefined },
    { key: "notes", label: "Заметки" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  const companyName = app?.job.companyName ?? "";
  const roleTitle = app?.job.roleTitle ?? "Application";
  const initial = getInitial(companyName || roleTitle);
  const vacancyDescription = getApplicationVacancyDescription(app);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-4">
            <span>Loopboard</span>
            <span>/</span>
            <button
              type="button"
              className="hover:text-foreground transition-colors"
              onClick={() => navigate(RoutePath[AppRoutes.APPLICATIONS])}
            >
              Заявки
            </button>
            <span>/</span>
            <span className="text-muted-foreground truncate max-w-[200px]">
              {companyName ? `${companyName} · ${roleTitle}` : roleTitle}
            </span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* Company logo */}
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-muted text-[18px] font-bold uppercase text-muted-foreground">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                    {roleTitle}
                  </h1>
                  {app &&
                    (() => {
                      const sk = normalizeStatusKey(
                        app.process.status,
                      ) as StatusKey | null;
                      return sk ? (
                        <StatusPill
                          status={sk}
                          className="text-[11px]"
                          dotSize="xs"
                        />
                      ) : null;
                    })()}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-muted-foreground flex-wrap">
                  {companyName && (
                    <span className="font-medium text-foreground">
                      {companyName}
                    </span>
                  )}
                  {app?.job.locationText && (
                    <span>· {app.job.locationText}</span>
                  )}
                  {app?.job.salary && (
                    <span>
                      · {app.job.salary.currency}
                      {app.job.salary.min
                        ? ` ${app.job.salary.min / 1000}K`
                        : ""}
                      {app.job.salary.max
                        ? `–${app.job.salary.max / 1000}K`
                        : ""}
                    </span>
                  )}
                  {days > 0 && (
                    <span>
                      · {days} {days === 1 ? "день" : days < 5 ? "дня" : "дней"}{" "}
                      в воронке
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-2 shrink-0">
              {app?.job.vacancyUrl && (
                <a
                  href={app.job.vacancyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  Открыть вакансию
                </a>
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                Сохранить
              </button>
              {app && (
                <StatusDropdown
                  current={app.process.status}
                  onChange={(s) => void onChangeStatus(s)}
                  disabled={isMutating}
                />
              )}
              <button
                type="button"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[7px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 mt-4 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer select-none",
                  tab === t.key
                    ? "border-b-2 border-primary font-medium text-foreground"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="text-[10.5px] px-1.5 py-px rounded-full bg-muted border border-border text-muted-foreground tabular-nums">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7">
          {error && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
              {error}
            </div>
          )}

          {isLoading && !app && (
            <div className="text-[13px] text-muted-foreground">Загрузка…</div>
          )}

          {!isLoading && !app && (
            <div className="text-[13px] text-muted-foreground">
              Заявка не найдена.
            </div>
          )}

          {app && (
            <>
              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
                  {/* Left */}
                  <div className="flex flex-col gap-4">
                    {/* Stage ribbon */}
                    <div className="rounded-[14px] border border-border bg-card p-5">
                      <div className="flex items-baseline justify-between mb-3">
                        <SLabel>Этап воронки</SLabel>
                        <span className="text-[12px] text-muted-foreground">
                          Сейчас: {statusLabel(app.process.status)}
                        </span>
                      </div>
                      <StageRibbon current={app.process.status} />
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        {
                          label: "Match-скор",
                          value: app.matching
                            ? String(app.matching.score)
                            : "—",
                          sub: app.matching ? "/ 100" : "нет данных",
                          accent: "text-primary",
                        },
                        {
                          label: "Дней в воронке",
                          value: String(days),
                          sub: "с создания",
                        },
                        {
                          label: "Интервью",
                          value: String(interviewCount),
                          sub: "всего записей",
                        },
                        {
                          label: "Событий",
                          value: String(history.length),
                          sub: "в хронологии",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-[14px] border border-border bg-card p-4"
                        >
                          <SLabel>{s.label}</SLabel>
                          <div className="flex items-baseline gap-1.5 mt-2">
                            <span
                              className={[
                                "text-[26px] font-semibold tracking-[-0.025em] tabular-nums",
                                s.accent ?? "text-foreground",
                              ].join(" ")}
                            >
                              {s.value}
                            </span>
                            <span className="text-[11.5px] text-muted-foreground">
                              {s.sub}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI brief (stub — needs backend) */}
                    <div className="rounded-[14px] border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <SLabel>AI-бриф</SLabel>
                        </div>
                        <button
                          type="button"
                          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Перегенерировать
                        </button>
                      </div>
                      {app.matching ? (
                        <>
                          <p className="text-[13.5px] leading-[1.65] text-muted-foreground">
                            {app.matching.decision === "match"
                              ? "Сильное совпадение с вакансией."
                              : app.matching.decision === "maybe"
                                ? "Возможное совпадение."
                                : "Слабое совпадение с вакансией."}
                            {app.matching.matchedSkillsTop?.length > 0
                              ? ` Совпадают: ${app.matching.matchedSkillsTop.join(", ")}.`
                              : ""}
                            {app.matching.gapsTop?.length > 0
                              ? ` Стоит добавить: ${app.matching.gapsTop.join(", ")}.`
                              : ""}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                            {app.matching.matchedSkillsTop?.map((t) => (
                              <span
                                key={t}
                                className="rounded-[5px] border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[11.5px] text-emerald-700 dark:text-emerald-400"
                              >
                                ✓ {t}
                              </span>
                            ))}
                            {app.matching.gapsTop?.map((t) => (
                              <span
                                key={t}
                                className="rounded-[5px] border border-border bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-[13px] text-muted-foreground">
                          {/* TODO(backend-migration): GET /api/v1/applications/:appId/matching — AI-бриф генерируется на сервере после анализа JD и CV */}
                          AI-анализ ещё не доступен. Добавьте описание вакансии
                          и навыки в профиль.
                        </p>
                      )}
                    </div>

                    {/* Vacancy description preview */}
                    <div className="rounded-[14px] border border-border bg-card p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <SLabel>Описание вакансии</SLabel>
                        <button
                          type="button"
                          onClick={() => setTab("description")}
                          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Открыть
                        </button>
                      </div>
                      {vacancyDescription ? (
                        <p className="line-clamp-6 whitespace-pre-wrap text-[13px] leading-[1.65] text-muted-foreground">
                          {vacancyDescription}
                        </p>
                      ) : (
                        <p className="text-[13px] leading-[1.65] text-muted-foreground">
                          Описание вакансии пока не добавлено. При импорте по
                          ссылке оно сохранится здесь.
                        </p>
                      )}
                    </div>

                    {/* Next action stub */}
                    {/* TODO(backend-migration): GET /api/v1/applications/:appId/next-action */}
                    <div
                      className="rounded-[14px] border bg-card p-5"
                      style={
                        {
                          background:
                            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 5%, var(--card)), var(--card))",
                          borderColor:
                            "color-mix(in oklab, var(--primary) 20%, var(--border))",
                        } as React.CSSProperties
                      }
                    >
                      <SLabel>Следующее действие</SLabel>
                      <p className="mt-3 text-[13px] text-muted-foreground">
                        {/* TODO(backend-migration): backend should compute next recommended action */}
                        Запланируйте следующий шаг — отправка, интервью или
                        follow-up.
                      </p>
                    </div>
                  </div>

                  {/* Right sidebar */}
                  <div className="flex flex-col gap-4">
                    {/* Job meta */}
                    <div className="rounded-[14px] border border-border bg-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <SLabel>Параметры вакансии</SLabel>
                        <button
                          type="button"
                          onClick={() => setTab("notes")}
                          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Изменить
                        </button>
                      </div>
                      <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: "auto 1fr" }}
                      >
                        {[
                          ["Источник", app.job.source ?? "—"],
                          ["Локация", app.job.locationText ?? "—"],
                          ["Формат", app.job.workMode ?? "—"],
                          ["Создано", formatDate(app.createdAt)],
                        ].map(([k, v]) => (
                          <div key={k} className="contents">
                            <span className="text-[12.5px] text-muted-foreground py-1.5 border-b border-border/50">
                              {k}
                            </span>
                            <span className="text-[12.5px] font-medium text-foreground py-1.5 border-b border-border/50 text-right truncate">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Match score */}
                    {app.matching && (
                      <div className="rounded-[14px] border border-border bg-card p-5">
                        <SLabel>Совпадение по CV</SLabel>
                        <MatchBar score={app.matching.score} />
                        <p className="mt-3 text-[11.5px] text-muted-foreground leading-[1.5]">
                          {app.matching.matchedSkillsTop?.length > 0
                            ? `Сильные: ${app.matching.matchedSkillsTop.join(", ")}.`
                            : ""}
                          {app.matching.gapsTop?.length > 0
                            ? ` Пробелы: ${app.matching.gapsTop.join(", ")}.`
                            : ""}
                        </p>
                      </div>
                    )}

                    {/* Quick comment */}
                    <div className="rounded-[14px] border border-border bg-card p-5">
                      <SLabel>Быстрая заметка</SLabel>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Добавить комментарий…"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && commentText.trim())
                              void onAddComment();
                          }}
                          className="flex-1 rounded-[8px] border border-border bg-muted/50 px-3 py-1.5 text-[12.5px] focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={!commentText.trim() || isMutating}
                          onClick={() => void onAddComment()}
                          className="rounded-[8px] bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground disabled:opacity-50 transition-opacity hover:opacity-90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DESCRIPTION ── */}
              {tab === "description" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="rounded-[14px] border border-border bg-card p-7">
                    <h2 className="text-[18px] font-semibold tracking-[-0.02em] mb-4">
                      О роли
                    </h2>
                    {app.job.vacancyUrl ? (
                      <a
                        href={app.job.vacancyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12.5px] text-primary hover:underline mb-4"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Открыть вакансию
                      </a>
                    ) : null}
                    {vacancyDescription ? (
                      <div className="whitespace-pre-wrap rounded-[12px] border border-border bg-muted/30 p-4 text-[13.5px] leading-[1.7] text-foreground">
                        {vacancyDescription}
                      </div>
                    ) : (
                      <p className="text-[13.5px] leading-[1.7] text-muted-foreground">
                        Описание вакансии не добавлено. Импортируйте вакансию
                        по ссылке или вставьте текст вручную при создании заявки.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[14px] border border-border bg-card p-5">
                    <SLabel>Ключевые слова</SLabel>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {app.notes?.tags?.length ? (
                        app.notes.tags.map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 rounded-[5px] border border-border bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground"
                          >
                            <Tag className="h-3 w-3" />
                            {t}
                          </span>
                        ))
                      ) : (
                        <p className="text-[12px] text-muted-foreground">
                          Теги не добавлены.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("notes")}
                      className="mt-4 text-[12px] text-primary hover:underline"
                    >
                      Редактировать теги →
                    </button>
                  </div>
                </div>
              )}

              {/* ── TIMELINE ── */}
              {tab === "timeline" && (
                <div className="max-w-[800px]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {HISTORY_TYPE_FILTERS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setHistoryType(option.value)}
                          className={[
                            "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                            historyType === option.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-muted",
                          ].join(" ")}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[12px] text-muted-foreground">
                      Показано {history.length} из {historyTotal}
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      История пока пуста.
                    </p>
                  ) : (
                    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
                      {history.map((h, i) => (
                        <div
                          key={h.id}
                          className={[
                            "grid gap-4 px-5 py-4",
                            i < history.length - 1
                              ? "border-b border-border"
                              : "",
                          ].join(" ")}
                          style={{ gridTemplateColumns: "80px 24px 1fr" }}
                        >
                          {/* Date */}
                          <div className="text-right pt-0.5">
                            <div className="text-[12px] font-medium text-foreground">
                              {formatTs(h.data.createdAt).split(",")[0]}
                            </div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                              {formatTs(h.data.createdAt).split(",")[1]?.trim()}
                            </div>
                          </div>

                          {/* Dot + line */}
                          <div className="relative flex justify-center">
                            <div
                              className={`mt-1.5 h-[10px] w-[10px] rounded-full ${historyDot(h.data)}`}
                            />
                            {i < history.length - 1 && (
                              <div className="absolute top-4 bottom-[-17px] left-1/2 w-px -translate-x-1/2 bg-border" />
                            )}
                          </div>

                          {/* Content */}
                          <div>
                            <div className="text-[13.5px] font-medium text-foreground leading-snug">
                              {historyEventTitle(h.data)}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground mt-1">
                              {h.data.actor}
                            </div>
                            {h.data.type === "COMMENT" && h.data.comment && (
                              <div className="mt-2 text-[13px] text-foreground leading-relaxed">
                                {h.data.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {history.length < historyTotal ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void loadHistoryPage(historyOffset + historyLimit, "append")}
                      className="mt-3 rounded-[10px] border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      Загрузить ещё
                    </button>
                  ) : null}

                  {/* Add comment */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Добавить заметку в хронологию…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && commentText.trim())
                          void onAddComment();
                      }}
                      className="flex-1 rounded-[10px] border border-border bg-card px-4 py-2 text-[13px] focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!commentText.trim() || isMutating}
                      onClick={() => void onAddComment()}
                      className="rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-50 transition-opacity hover:opacity-90"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              )}

              {/* ── PREP ── */}
              {tab === "prep" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
                  <div className="rounded-[14px] border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <SLabel>Подготовка к интервью</SLabel>
                    </div>
                    {/* TODO(backend-migration): POST /api/v1/applications/:appId/prep — AI generates checklist and questions based on JD + user profile */}
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Подготовка генерируется AI на основе описания вакансии и
                      вашего профиля. Добавьте описание вакансии на вкладке
                      «Описание», чтобы получить персональный чек-лист и
                      вопросы.
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-border bg-card p-5">
                    <SLabel>Материалы</SLabel>
                    {/* TODO(backend-migration): GET /api/v1/resources?tags=... — linked learning resources */}
                    <p className="mt-3 text-[12px] text-muted-foreground">
                      Материалы для подготовки появятся после анализа вакансии.
                    </p>
                  </div>
                </div>
              )}

              {/* ── CONTACTS ── */}
              {tab === "contacts" && (
                <div className="max-w-[900px]">
                  <div className="rounded-[14px] border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <SLabel>Контакты по заявке</SLabel>
                      {/* TODO(backend-migration): POST /api/v1/applications/:appId/contacts */}
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Привязать контакт
                      </button>
                    </div>
                    {/* TODO(backend-migration): GET /api/v1/applications/:appId/contacts — contact list from DB */}
                    <div className="px-5 py-10 text-center">
                      <p className="text-[13px] text-muted-foreground">
                        Контакты не добавлены. Привяжите рекрутера или HR из
                        вашей книги контактов.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FILES ── */}
              {tab === "files" && (
                <div className="max-w-[900px]">
                  <div className="rounded-[14px] border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <div>
                        <SLabel>Прикреплённые файлы</SLabel>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {documentsTotal > 0
                            ? `${documentsTotal} файлов`
                            : "Файлы пока не прикреплены"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={documentUploadKind}
                          onChange={(event) =>
                            setDocumentUploadKind(
                              event.target.value as DocumentKind,
                            )
                          }
                          disabled={isMutating}
                          className="rounded-md border border-border bg-background px-2 py-1 text-[12px] text-muted-foreground disabled:opacity-50"
                        >
                          <option value="cv">CV</option>
                          <option value="cover_letter">Cover letter</option>
                          <option value="portfolio">Portfolio</option>
                          <option value="other">Other</option>
                        </select>
                        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
                          <Plus className="h-3.5 w-3.5" />
                          Добавить файл
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip"
                            disabled={isMutating}
                            className="hidden"
                            onChange={(event) => {
                              const file =
                                event.currentTarget.files?.[0] ?? null;
                              event.currentTarget.value = "";
                              void onUploadDocument(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {isDocumentsLoading ? (
                      <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                        Загрузка файлов…
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
                        <p className="text-[13px] text-muted-foreground">
                          Файлы не прикреплены. Добавьте PDF, DOCX, TXT или ZIP
                          до 10 MB.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {documents.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 px-5 py-4"
                          >
                            <div className="min-w-0 flex items-start gap-3">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-foreground">
                                  {item.originalFilename}
                                </p>
                                <p className="mt-1 text-[12px] text-muted-foreground">
                                  {documentKindLabel(item.kind)} ·{" "}
                                  {item.contentType} ·{" "}
                                  {formatBytes(item.sizeBytes)}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground/80">
                                  {item.status} ·{" "}
                                  {formatIsoDate(item.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void onDownloadDocument(item.id)}
                                disabled={isMutating}
                                className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void onDeleteDocument(item.id)}
                                disabled={isMutating}
                                className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground hover:text-destructive disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end border-t border-border px-5 py-3">
                      <button
                        type="button"
                        onClick={() => void refreshDocuments()}
                        disabled={isDocumentsLoading || isMutating}
                        className="text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        Обновить список
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTES / EDIT ── */}
              {tab === "notes" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
                  {/* Left: editable job fields */}
                  <div className="flex flex-col gap-4">
                    <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                      <SLabel>Данные вакансии</SLabel>
                      <InlineField
                        label="Role title"
                        value={app.job.roleTitle}
                        onSave={(v) =>
                          saveField({ "job.roleTitle": v }, "job.roleTitle")
                        }
                        disabled={isMutating}
                        placeholder="—"
                      />
                      <InlineField
                        label="Company"
                        value={app.job.companyName}
                        onSave={(v) =>
                          saveField({ "job.companyName": v }, "job.companyName")
                        }
                        disabled={isMutating}
                        placeholder="—"
                      />
                      <InlineField
                        label="Location"
                        value={app.job.locationText ?? ""}
                        onSave={(v) =>
                          saveField(
                            { "job.locationText": v },
                            "job.locationText",
                          )
                        }
                        disabled={isMutating}
                        placeholder="—"
                      />
                      <InlineField
                        label="Vacancy URL"
                        value={app.job.vacancyUrl ?? ""}
                        onSave={(v) =>
                          saveField({ "job.vacancyUrl": v }, "job.vacancyUrl")
                        }
                        type="url"
                        disabled={isMutating}
                        placeholder="—"
                      />
                      <InlineField
                        label="Source"
                        value={app.job.source ?? ""}
                        onSave={(v) =>
                          saveField({ "job.source": v }, "job.source")
                        }
                        disabled={isMutating}
                        placeholder="—"
                      />
                      <SalaryField
                        salary={app.job.salary}
                        onSave={(salary) =>
                          saveField({ "job.salary": salary }, "job.salary")
                        }
                        disabled={isMutating}
                      />
                      <WorkModeChips
                        current={app.job.workMode}
                        onSelect={(mode) => void saveWorkMode(mode)}
                        disabled={isMutating}
                      />
                    </div>
                  </div>

                  {/* Right: notes + tags */}
                  <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                    <SLabel>Заметки и теги</SLabel>
                    <InlineField
                      label="Заметка"
                      value={app.notes?.currentNote ?? ""}
                      onSave={(v) =>
                        saveField(
                          { "notes.currentNote": v },
                          "notes.currentNote",
                        )
                      }
                      multiline
                      disabled={isMutating}
                      placeholder="Добавить заметку…"
                    />
                    <TagsField
                      tags={app.notes?.tags ?? []}
                      onSave={(tags) =>
                        saveField({ "notes.tags": tags }, "notes.tags")
                      }
                      disabled={isMutating}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
