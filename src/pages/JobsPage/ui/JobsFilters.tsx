import React from "react";

import { JOB_STATUSES } from "src/entities/job/model/constants";
import type { JobStatus } from "src/entities/job/model/types";
import { Button, Input } from "src/shared/ui";

import type { JobsSort } from "../model/useJobQueryParams";

type Props = {
  activeStatus: JobStatus | null;
  q: string;
  sort: JobsSort;
  pageSize: number;

  onSelectStatus: (s: JobStatus | null) => void;
  onSearch: (q: string) => void;
  onSort: (s: JobsSort) => void;
  onPageSize: (n: number) => void;

  onReset: () => void;
  showReset: boolean;
};

function statusLabel(s: JobStatus | null) {
  return s ? s.toUpperCase() : "ALL";
}

export function JobsFilters({
  activeStatus,
  q,
  sort,
  pageSize,
  onSelectStatus,
  onSearch,
  onSort,
  onPageSize,
  onReset,
  showReset,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="min-w-[220px] flex-1">
          <Input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search title/company…"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Status</div>
          <select
            value={activeStatus ?? "all"}
            onChange={(e) => {
              const v = e.target.value;
              onSelectStatus(v === "all" ? null : (v as JobStatus));
            }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            aria-label="Filter by status"
          >
            <option value="all">{statusLabel(null)}</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Sort</div>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as JobsSort)}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            aria-label="Sort jobs"
          >
            <option value="updated_desc">Recently updated</option>
            <option value="created_desc">Newest created</option>
            <option value="company_asc">Company A→Z</option>
            <option value="title_asc">Title A→Z</option>
          </select>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Per page</div>
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            aria-label="Items per page"
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
          </select>
        </div>

        {/* Reset */}
        {showReset ? (
          <Button variant="ghost" size="sm" shape="pill" onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Filters stored in URL (refresh won’t reset).
      </div>
    </div>
  );
}
