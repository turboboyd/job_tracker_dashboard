import React from "react";

import type { LoopMatchStatus } from "src/entities/loop/model/types";
import type { MatchesFiltersState } from "src/entities/match/model";
import { deriveMatchesFilterChips } from "src/entities/match/model";
import { classNames } from "src/shared/lib";
import {
  Button,
  Card,
  DebouncedInputField,
  SelectField,
  MultiSelectDropdown,
} from "src/shared/ui";


function Chip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground shadow-sm">
      <span className="truncate max-w-[220px]">{children}</span>

      <Button
        variant="ghost"
        size="icon"
        shape="pill"
        shadow="none"
        onClick={onRemove}
        aria-label="Remove filter"
        className={classNames(
          "h-6 w-6 p-0",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        ✕
      </Button>
    </span>
  );
}

export function MatchesFilters({
  value,
  onChange,
  onReset,

  loopOptions,
  platformOptions,
  statusOptions,

  totalCount,
  filteredCount,
  loopsLoading,
}: {
  value: MatchesFiltersState;
  onChange: (next: MatchesFiltersState) => void;
  onReset: () => void;

  loopOptions: Array<{ id: string; name: string }>;
  platformOptions: string[];
  statusOptions: LoopMatchStatus[];

  totalCount: number;
  filteredCount: number;
  loopsLoading: boolean;
}) {
  const set = (patch: Partial<MatchesFiltersState>) =>
    onChange({ ...value, ...patch });

  const chips = React.useMemo(
    () => deriveMatchesFilterChips({ filters: value, loopOptions }),
    [value, loopOptions]
  );

  const isDefault = chips.length === 0;

  return (
    <Card
      variant="default"
      padding="sm"
      shadow="sm"
      className="space-y-md overflow-visible"
    >
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCount}</span>{" "}
          of <span className="font-medium text-foreground">{totalCount}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          shape="pill"
          shadow="sm"
          disabled={isDefault}
          onClick={onReset}
        >
          Reset
        </Button>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-sm">
          {chips.map((c) => (
            <Chip key={c.key} onRemove={() => set(c.patch)}>
              {c.label}
            </Chip>
          ))}

          <Button
            variant="link"
            size="sm"
            shape="pill"
            shadow="none"
            onClick={onReset}
            className={classNames(
              "ml-1 h-auto px-0 py-0",
              "text-xs text-muted-foreground",
              "underline underline-offset-2",
              "hover:text-foreground"
            )}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      {/* ONE ROW ON lg, WRAP ON SMALLER */}
      <div className="grid grid-cols-1 gap-md md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-2">
          <DebouncedInputField
            label="Search"
            value={value.q}
            onValueChange={(q) => set({ q })}
            delay={250}
            preset="search"
            inputSize="sm"
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <SelectField
            label="Sort"
            value={value.sort}
            onChange={(sort) => set({ sort })}
            size="sm"
            options={[
              { value: "matchedAtDesc", label: "Newest" },
              { value: "matchedAtAsc", label: "Oldest" },
              { value: "titleAsc", label: "Title A→Z" },
              { value: "companyAsc", label: "Company A→Z" },
            ]}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label="Loops"
            value={value.loopIds}
            onChange={(loopIds) => set({ loopIds })}
            options={loopOptions.map((l) => ({ value: l.id, label: l.name }))}
            placeholder={loopsLoading ? "Loading…" : "All loops"}
            clearLabel="Clear"
            searchable
            disabled={loopsLoading}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label="Platforms"
            value={value.platforms}
            onChange={(platforms) => set({ platforms })}
            options={platformOptions.map((p) => ({
              value: p,
              label: p.toUpperCase(),
            }))}
            placeholder="All platforms"
            clearLabel="Clear"
            searchable
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label="Statuses"
            value={value.statuses}
            onChange={(statuses) => set({ statuses })}
            options={statusOptions.map((s) => ({ value: s, label: String(s) }))}
            placeholder="All statuses"
            clearLabel="Clear"
          />
        </div>
      </div>
    </Card>
  );
}
