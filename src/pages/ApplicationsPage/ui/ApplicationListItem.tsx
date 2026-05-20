import { Archive, ChevronDown, ChevronRight, Check, RotateCcw, Star } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { normalizeStatusKey, type StatusKey } from "src/entities/application/model/status";
import { StatusDot, StatusPill } from "src/entities/application/ui/StatusKit";

import type { ProcessStatus } from "../api/applicationsRepo";
import { resolveApplicationLoopTitle } from "../model/applicationsPage.helpers";
import type { AppRow } from "../model/useApplicationsPage";

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== "function") return "";
  const d = ts.toDate();
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ─── Match bar ──────────────────────────────────────────────────────────────

function getMatchBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-accent";
  return "bg-muted-foreground/40";
}

function MatchBar({ score }: { score: number }) {
  const barColor = getMatchBarColor(score);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-[4px] w-[36px] overflow-hidden rounded-full bg-muted">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        title="AI match score: ≥85 strong, ≥70 good, <70 weak"
        className="text-[11.5px] tabular-nums text-muted-foreground"
      >
        {score}
      </span>
    </div>
  );
}

// ─── Status dropdown options ────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProcessStatus; label: string }[] = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW_1", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NO_RESPONSE", label: "No response" },
];

function StatusDropdown({
  currentStatus,
  onChangeStatus,
  appId,
}: {
  currentStatus: ProcessStatus;
  onChangeStatus: (appId: string, status: ProcessStatus) => void;
  appId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sk = normalizeStatusKey(currentStatus) as StatusKey | null;

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenuPosition({
        left: rect.left,
        top: rect.bottom + 4,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen((v) => !v);
  }

  function handleSelect(e: React.MouseEvent, status: ProcessStatus) {
    e.stopPropagation();
    onChangeStatus(appId, status);
    setIsOpen(false);
  }

  const menu = isOpen && menuPosition
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[140px] rounded-[8px] border border-border bg-card py-1 shadow-xl"
          style={{ left: menuPosition.left, top: menuPosition.top }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map((opt) => {
            const optSk = normalizeStatusKey(opt.value) as StatusKey | null;
            const isCurrent = opt.value === currentStatus;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => handleSelect(e, opt.value)}
                className={[
                  "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-muted",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                ].join(" ")}
              >
                {optSk ? <StatusDot status={optSk} size="xs" /> : <span className="h-[6px] w-[6px]" />}
                <span className="flex-1 text-left">{opt.label}</span>
                {isCurrent && <Check className="h-3 w-3 text-primary" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 rounded-[5px] border border-border bg-muted/60 px-1.5 py-0.5 text-[11px] transition-colors hover:bg-muted"
      >
        {sk ? <StatusDot status={sk} size="xs" /> : null}
        <span className="max-w-[70px] truncate text-foreground">
          {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? String(currentStatus)}
        </span>
        <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
      </button>
      {menu}
    </div>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function handleClickableCardKeyDown(
  e: React.KeyboardEvent<HTMLDivElement>,
  onOpen: () => void,
): void {
  if (e.key !== "Enter" && e.key !== " ") return;

  e.preventDefault();
  onOpen();
}

export function ApplicationListItem({
  row,
  onChangeStatus,
  onToggleFavorite,
  onArchiveApplication,
  onRestoreApplication,
  isArchivedView = false,
  loopTitleById,
}: {
  row: AppRow;
  onChangeStatus?: (appId: string, status: ProcessStatus) => void;
  onToggleFavorite?: (appId: string, nextValue: boolean) => void;
  onArchiveApplication?: (appId: string) => void;
  onRestoreApplication?: (appId: string) => void;
  isArchivedView?: boolean;
  loopTitleById: ReadonlyMap<string, string>;
}) {
  const navigate = useNavigate();

  const { job, process, matching } = row.data;
  const sk = normalizeStatusKey(process.status) as StatusKey | null;
  const initial = getInitial(job.companyName || job.roleTitle || "?");
  const dateStr = formatDate(row.data.createdAt);
  const isFav = row.data.isFavorite === true;
  const loopTitle = resolveApplicationLoopTitle(row, loopTitleById);

  const openApplication = () => navigate(`/dashboard/applications/${row.id}`);
  let statusNode: React.ReactNode;

  if (onChangeStatus) {
    statusNode = (
      <StatusDropdown
        currentStatus={process.status as ProcessStatus}
        onChangeStatus={onChangeStatus}
        appId={row.id}
      />
    );
  } else if (sk) {
    statusNode = <StatusPill status={sk} className="text-[11px]" dotSize="xs" />;
  } else {
    statusNode = (
      <span className="text-[11px] text-muted-foreground">{String(process.status)}</span>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openApplication}
      onKeyDown={(e) => handleClickableCardKeyDown(e, openApplication)}
      className="grid w-full cursor-pointer items-center gap-3 px-3 py-[7px] text-left transition-[background] duration-[120ms] hover:bg-muted"
      style={{
        gridTemplateColumns: "32px 2.4fr 1.2fr 120px 110px 90px 30px",
      }}
    >
      <div className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-[5px] border border-border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
        {initial}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {isFav && <span className="mr-1 text-accent">★</span>}
          {job.roleTitle}
        </div>
        <div className="truncate text-[11.5px] leading-tight text-muted-foreground">
          {job.companyName}
          {dateStr ? <span className="ml-1 opacity-60">· {dateStr}</span> : null}
        </div>
      </div>

      <div className="truncate text-[12px] text-muted-foreground">
        {job.locationText ?? "—"}
      </div>

      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        {statusNode}
      </div>

      <div className="truncate text-[11.5px] text-muted-foreground" title={loopTitle}>
        {loopTitle}
      </div>

      <div className="flex items-center">
        {matching ? (
          <MatchBar score={matching.score} />
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {onToggleFavorite ? (
          <button
            type="button"
            title={isFav ? "Убрать из избранного" : "В избранное"}
            onClick={() => onToggleFavorite(row.id, !isFav)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Star className={`h-[14px] w-[14px] ${isFav ? "fill-current text-amber-500" : ""}`} />
          </button>
        ) : null}
        {isArchivedView && onRestoreApplication ? (
          <button
            type="button"
            title="Восстановить"
            onClick={() => onRestoreApplication(row.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-[14px] w-[14px]" />
          </button>
        ) : null}
        {!isArchivedView && onArchiveApplication ? (
          <button
            type="button"
            title="Архивировать"
            onClick={() => onArchiveApplication(row.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <Archive className="h-[14px] w-[14px]" />
          </button>
        ) : null}
        <ChevronRight className="h-[14px] w-[14px] text-muted-foreground/50" />
      </div>
    </div>
  );
}

// ─── Card tile (cards view) ──────────────────────────────────────────────────

export function ApplicationCardTile({
  row,
  onToggleFavorite,
  onArchiveApplication,
  onRestoreApplication,
  isArchivedView = false,
  loopTitleById,
}: {
  row: AppRow;
  onToggleFavorite?: (appId: string, nextValue: boolean) => void;
  onArchiveApplication?: (appId: string) => void;
  onRestoreApplication?: (appId: string) => void;
  isArchivedView?: boolean;
  loopTitleById: ReadonlyMap<string, string>;
}) {
  const navigate = useNavigate();

  const { job, process, matching } = row.data;
  const isFav = row.data.isFavorite === true;
  const sk = normalizeStatusKey(process.status) as StatusKey | null;
  const initial = getInitial(job.companyName || job.roleTitle || "?");
  const dateStr = formatDate(row.data.createdAt);
  const loopTitle = resolveApplicationLoopTitle(row, loopTitleById);

  const openApplication = () => navigate(`/dashboard/applications/${row.id}`);
  const statusNode = sk ? (
    <StatusPill status={sk} className="text-[10.5px]" dotSize="xs" />
  ) : (
    <span className="text-[10.5px] text-muted-foreground">{String(process.status)}</span>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openApplication}
      onKeyDown={(e) => handleClickableCardKeyDown(e, openApplication)}
      className="flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-[14px] border border-border bg-card p-3 text-left transition-[background] duration-[120ms] hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[13px] font-semibold uppercase text-muted-foreground">
          {initial}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onToggleFavorite ? (
            <button
              type="button"
              title={isFav ? "Убрать из избранного" : "В избранное"}
              onClick={() => onToggleFavorite(row.id, !isFav)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <Star className={`h-3.5 w-3.5 ${isFav ? "fill-current text-amber-500" : ""}`} />
            </button>
          ) : null}
          {isArchivedView && onRestoreApplication ? (
            <button
              type="button"
              title="Восстановить"
              onClick={() => onRestoreApplication(row.id)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {!isArchivedView && onArchiveApplication ? (
            <button
              type="button"
              title="Архивировать"
              onClick={() => onArchiveApplication(row.id)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {statusNode}
        </div>
      </div>

      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold leading-snug text-foreground">
          {job.roleTitle}
        </div>
        <div className="truncate text-[12px] leading-snug text-muted-foreground">
          {job.companyName}
          {job.locationText ? <span className="ml-1 opacity-70">· {job.locationText}</span> : null}
        </div>
        <div className="mt-1 truncate text-[11px] text-muted-foreground/80" title={loopTitle}>
          Направление: {loopTitle}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground/70">{dateStr || "—"}</span>
        {matching ? (
          <MatchBar score={matching.score} />
        ) : null}
      </div>
    </div>
  );
}
