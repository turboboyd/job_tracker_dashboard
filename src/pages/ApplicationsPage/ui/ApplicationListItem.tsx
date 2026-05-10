import { ChevronDown, ChevronRight, Check } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { normalizeStatusKey, type StatusKey } from "src/entities/application/model/status";
import { StatusDot, StatusPill } from "src/entities/application/ui/StatusKit";

import type { ProcessStatus } from "../api/applicationsRepo";
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

function MatchBar({ score }: { score: number }) {
  const barColor =
    score >= 85
      ? "bg-emerald-500"
      : score >= 70
        ? "bg-accent"
        : "bg-muted-foreground/40";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const sk = normalizeStatusKey(currentStatus) as StatusKey | null;

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  return (
    <div ref={containerRef} className="relative">
      <button
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

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-[8px] border border-border bg-card py-1 shadow-xl">
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
        </div>
      )}
    </div>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

export function ApplicationListItem({
  row,
  onChangeStatus,
}: {
  row: AppRow;
  onChangeStatus?: (appId: string, status: ProcessStatus) => void;
}) {
  const navigate = useNavigate();

  const { job, process, matching, loopLinkage } = row.data;
  const sk = normalizeStatusKey(process.status) as StatusKey | null;
  const initial = getInitial(job.companyName || job.roleTitle || "?");
  const dateStr = formatDate(row.data.createdAt);
  const isFav = false; // no favorite field in model yet — placeholder

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/applications/${row.id}`)}
      className="grid w-full items-center gap-3 px-3 py-[7px] text-left transition-[background] duration-[120ms] hover:bg-muted"
      style={{
        gridTemplateColumns: "32px 2.4fr 1.2fr 120px 110px 90px 30px",
      }}
    >
      {/* Col 1 – Avatar */}
      <div className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-[5px] border border-border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
        {initial}
      </div>

      {/* Col 2 – Role + Company/Date */}
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

      {/* Col 3 – Location */}
      <div className="truncate text-[12px] text-muted-foreground">
        {job.locationText ?? "—"}
      </div>

      {/* Col 4 – Status (dropdown or pill) */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        {onChangeStatus ? (
          <StatusDropdown
            currentStatus={process.status as ProcessStatus}
            onChangeStatus={onChangeStatus}
            appId={row.id}
          />
        ) : sk ? (
          <StatusPill status={sk} className="text-[11px]" dotSize="xs" />
        ) : (
          <span className="text-[11px] text-muted-foreground">{String(process.status)}</span>
        )}
      </div>

      {/* Col 5 – Loop name */}
      <div className="truncate text-[11.5px] text-muted-foreground">
        {loopLinkage?.loopId ?? "—"}
      </div>

      {/* Col 6 – Match score */}
      <div className="flex items-center">
        {matching ? (
          <MatchBar score={matching.score} />
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Col 7 – Arrow */}
      <div className="flex items-center justify-end">
        <ChevronRight className="h-[14px] w-[14px] text-muted-foreground/50" />
      </div>
    </button>
  );
}

// ─── Card tile (cards view) ──────────────────────────────────────────────────

export function ApplicationCardTile({ row }: { row: AppRow }) {
  const navigate = useNavigate();

  const { job, process, matching } = row.data;
  const sk = normalizeStatusKey(process.status) as StatusKey | null;
  const initial = getInitial(job.companyName || job.roleTitle || "?");
  const dateStr = formatDate(row.data.createdAt);

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/applications/${row.id}`)}
      className="flex w-full flex-col gap-2 rounded-[14px] border border-border bg-card p-3 text-left transition-[background] duration-[120ms] hover:bg-muted overflow-hidden"
    >
      {/* Top row: avatar + status pill */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[13px] font-semibold uppercase text-muted-foreground">
          {initial}
        </div>
        {sk ? (
          <StatusPill status={sk} className="text-[10.5px]" dotSize="xs" />
        ) : (
          <span className="text-[10.5px] text-muted-foreground">{String(process.status)}</span>
        )}
      </div>

      {/* Role + Company/Location */}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold leading-snug text-foreground">
          {job.roleTitle}
        </div>
        <div className="truncate text-[12px] leading-snug text-muted-foreground">
          {job.companyName}
          {job.locationText ? <span className="ml-1 opacity-70">· {job.locationText}</span> : null}
        </div>
      </div>

      {/* Footer: date | match */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground/70">{dateStr || "—"}</span>
        {matching ? (
          <MatchBar score={matching.score} />
        ) : null}
      </div>
    </button>
  );
}
