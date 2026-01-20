import React from "react";

import { LOOP_MATCH_STATUSES } from "src/entities/loop/model/constants";
import type { LoopMatchStatus } from "src/entities/loop/model/types";
import { Card, Button } from "src/shared/ui";

export type MatchesFiltersState = {
  q: string;
  loopId: "all" | string;
  platform: "all" | string;
  status: "all" | LoopMatchStatus;
  sort: "matchedAtDesc" | "matchedAtAsc" | "titleAsc" | "companyAsc";
};

export function MatchesFilters({
  value,
  onChange,
  loopOptions,
  platformOptions,
  totalCount,
  filteredCount,
  loopsLoading,
}: {
  value: MatchesFiltersState;
  onChange: (next: MatchesFiltersState) => void;
  loopOptions: Array<{ id: string; name: string }>;
  platformOptions: string[];
  totalCount: number;
  filteredCount: number;
  loopsLoading: boolean;
}) {
  const set = (patch: Partial<MatchesFiltersState>) => onChange({ ...value, ...patch });

  const clear = () =>
    onChange({
      q: "",
      loopId: "all",
      platform: "all",
      status: "all",
      sort: "matchedAtDesc",
    });

  return (
    <Card className="space-y-md rounded-lg border border-border bg-card p-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCount}</span> of{" "}
          <span className="font-medium text-foreground">{totalCount}</span>
        </div>

        <Button variant="outline" size="sm" shape="pill" onClick={clear}>
          Reset filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-md md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-sm block text-xs text-muted-foreground">Search</label>
          <input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Title, company, location…"
            className="h-9 w-full rounded-md border border-border bg-background px-md text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-sm block text-xs text-muted-foreground">Loop</label>
          <select
            value={value.loopId}
            onChange={(e) => set({ loopId: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-background px-md text-sm text-foreground"
          >
            <option value="all">{loopsLoading ? "Loading…" : "All loops"}</option>
            {loopOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-sm block text-xs text-muted-foreground">Platform</label>
          <select
            value={value.platform}
            onChange={(e) => set({ platform: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-background px-md text-sm text-foreground"
          >
            <option value="all">All platforms</option>
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md md:grid-cols-4">
        <div>
          <label className="mb-sm block text-xs text-muted-foreground">Status</label>
          <select
            value={value.status}
            onChange={(e) => set({ status: e.target.value as MatchesFiltersState["status"] })}
            className="h-9 w-full rounded-md border border-border bg-background px-md text-sm text-foreground"
          >
            <option value="all">All statuses</option>
            {LOOP_MATCH_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {String(s.value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-sm block text-xs text-muted-foreground">Sort</label>
          <select
            value={value.sort}
            onChange={(e) => set({ sort: e.target.value as MatchesFiltersState["sort"] })}
            className="h-9 w-full rounded-md border border-border bg-background px-md text-sm text-foreground"
          >
            <option value="matchedAtDesc">Matched date: newest</option>
            <option value="matchedAtAsc">Matched date: oldest</option>
            <option value="titleAsc">Title: A → Z</option>
            <option value="companyAsc">Company: A → Z</option>
          </select>
        </div>

        <div className="md:col-span-2" />
      </div>
    </Card>
  );
}
