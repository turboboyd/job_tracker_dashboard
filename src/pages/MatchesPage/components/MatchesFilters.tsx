import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";

import type { LoopMatchStatus } from "src/entities/loopMatch";
import { classNames } from "src/shared/lib";
import {
  Button,
  Card,
  DebouncedInputField,
  SelectField,
  MultiSelectDropdown,
  Pagination,
} from "src/shared/ui";

import { matchesFiltersDefaults } from "../model/filters";
import type { MatchesFiltersState, MatchesSort } from "../model/filters";


function Chip({
  children,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
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
        aria-label={removeLabel}
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

function labelSort(t: TFunction, v: MatchesSort) {
  switch (v) {
    case "matchedAtDesc":
      return t("matches.filters.sort.options.matchedAtDesc");
    case "matchedAtAsc":
      return t("matches.filters.sort.options.matchedAtAsc");
    case "titleAsc":
      return t("matches.filters.sort.options.titleAsc");
    case "companyAsc":
      return t("matches.filters.sort.options.companyAsc");
    default:
      return String(v);
  }
}

function labelStatus(t: TFunction, v: LoopMatchStatus) {
  return t(`matches.status.${v}`);
}

function buildChips(args: {
  t: TFunction;
  filters: MatchesFiltersState;
  loopOptions: Array<{ id: string; name: string }>;
}): Array<{ key: string; label: string; patch: Partial<MatchesFiltersState> }> {
  const { t, filters, loopOptions } = args;
  const chips: Array<{ key: string; label: string; patch: Partial<MatchesFiltersState> }> = [];

  if (filters.q.trim()) {
    chips.push({
      key: "q",
      label: t("matches.filters.chips.search", { q: filters.q.trim() }),
      patch: { q: "" },
    });
  }

  if (filters.sort !== matchesFiltersDefaults.sort) {
    chips.push({
      key: "sort",
      label: t("matches.filters.chips.sort", { value: labelSort(t, filters.sort) }),
      patch: { sort: matchesFiltersDefaults.sort },
    });
  }

  if (filters.loopIds.length) {
    const nameById = new Map(loopOptions.map((l) => [l.id, l.name]));
    const names = filters.loopIds.map((id) => nameById.get(id) ?? id).join(", ");
    chips.push({
      key: "loops",
      label: t("matches.filters.chips.loops", { value: names }),
      patch: { loopIds: [] },
    });
  }

  if (filters.platforms.length) {
    const names = filters.platforms.map((p) => p.toUpperCase()).join(", ");
    chips.push({
      key: "platforms",
      label: t("matches.filters.chips.platforms", { value: names }),
      patch: { platforms: [] },
    });
  }

  if (filters.statuses.length) {
    const names = filters.statuses.map((s) => labelStatus(t, s)).join(", ");
    chips.push({
      key: "statuses",
      label: t("matches.filters.chips.statuses", { value: names }),
      patch: { statuses: [] },
    });
  }

  return chips;
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

  page,
  totalPages,
  onPageChange,
  pageFrom,
  pageTo,
  pageDisabled,
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

  page: number;
  totalPages: number;
  onPageChange: (next: number | ((prev: number) => number)) => void;
  pageFrom: number;
  pageTo: number;
  pageDisabled: boolean;
}) {
  const { t } = useTranslation();

  const set = (patch: Partial<MatchesFiltersState>) =>
    onChange({ ...value, ...patch });

  const chips = React.useMemo(() => {
    return buildChips({ t, filters: value, loopOptions });
  }, [t, value, loopOptions]);

  const isDefault = chips.length === 0;

  return (
    <Card
      variant="default"
      padding="sm"
      shadow="sm"
      className="space-y-md overflow-visible"
    >
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-sm">
          <div className="text-sm text-muted-foreground">
            {t("matches.filters.showing", { filtered: filteredCount, total: totalCount })}
          </div>

          {chips.length ? (
            <>
              {chips.map((c) => (
                <Chip
                  key={c.key}
                  onRemove={() => set(c.patch)}
                  removeLabel={t("matches.filters.common.removeFilter")}
                >
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
                {t("matches.filters.clearAll")}
              </Button>
            </>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="sm"
          shape="pill"
          shadow="sm"
          disabled={isDefault}
          onClick={onReset}
        >
          {t("matches.filters.reset")}
        </Button>
      </div>

      {/* ONE ROW ON lg, WRAP ON SMALLER */}
      <div className="grid grid-cols-1 gap-md md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-2">
          <DebouncedInputField
            label={t("matches.filters.search.label")}
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
            label={t("matches.filters.sort.label")}
            value={value.sort}
            onChange={(sort) => set({ sort })}
            size="sm"
            options={[
              { value: "matchedAtDesc", label: t("matches.filters.sort.options.matchedAtDesc") },
              { value: "matchedAtAsc", label: t("matches.filters.sort.options.matchedAtAsc") },
              { value: "titleAsc", label: t("matches.filters.sort.options.titleAsc") },
              { value: "companyAsc", label: t("matches.filters.sort.options.companyAsc") },
            ]}
          />
        </div>
          
        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label={t("matches.filters.loops.label")}
            value={value.loopIds}
            onChange={(loopIds) => set({ loopIds })}
            options={loopOptions.map((l) => ({ value: l.id, label: l.name }))}
            placeholder={loopsLoading ? t("matches.filters.loops.loading") : t("matches.filters.loops.all")}
            clearLabel={t("matches.filters.common.clear")}
            searchable
            disabled={loopsLoading}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label={t("matches.filters.platforms.label")}
            value={value.platforms}
            onChange={(platforms) => set({ platforms })}
            options={platformOptions.map((p) => ({
              value: p,
              label: p.toUpperCase(),
            }))}
            placeholder={t("matches.filters.platforms.all")}
            clearLabel={t("matches.filters.common.clear")}
            searchable
          />
        </div>

        <div className="md:col-span-6 lg:col-span-2">
          <MultiSelectDropdown
            label={t("matches.filters.statuses.label")}
            value={value.statuses}
            onChange={(statuses) => set({ statuses })}
            options={statusOptions.map((s) => ({ value: s, label: labelStatus(t, s) }))}
            placeholder={t("matches.filters.statuses.all")}
            clearLabel={t("matches.filters.common.clear")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-md md:grid-cols-12">
        <div className="md:col-span-4 text-xs text-muted-foreground">
          {t("matches.filters.pageShowing", { from: pageFrom, to: pageTo, total: filteredCount })}
        </div>

        <div className="md:col-span-8 flex justify-start md:justify-end">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={pageDisabled}
            siblingCount={1}
          />
        </div>
      </div>
    </Card>
  );
}
