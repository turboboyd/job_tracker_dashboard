import type { ReactNode } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui";

import type { MatchesFiltersState } from "../model/filters";

import type { MatchesLoopOption } from "./matchesFilters.helpers";
import { buildActiveFilterChips } from "./matchesFilters.helpers";

interface FilterChipProps {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
}

interface MatchesFiltersSummaryRowProps {
  filteredCount: number;
  filters: MatchesFiltersState;
  isDefault: boolean;
  loopOptions: MatchesLoopOption[];
  onRemoveChip: (patch: Partial<MatchesFiltersState>) => void;
  onReset: () => void;
  totalCount: number;
}

interface MatchesPageSummaryProps {
  filteredCount: number;
  pageFrom: number;
  pageTo: number;
}

export function FilterChip({ children, onRemove, removeLabel }: FilterChipProps) {
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
          "focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        x
      </Button>
    </span>
  );
}

export function MatchesFiltersSummaryRow({
  filteredCount,
  totalCount,
  filters,
  loopOptions,
  onRemoveChip,
  onReset,
  isDefault,
}: MatchesFiltersSummaryRowProps) {
  const { t } = useTranslation();
  const chips = React.useMemo(
    () => buildActiveFilterChips({ t, filters, loopOptions }),
    [filters, loopOptions, t],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        <div className="text-sm text-muted-foreground">
          {t("matches.filters.showing", { filtered: filteredCount, total: totalCount })}
        </div>

        {chips.length ? (
          <>
            {chips.map((chip) => (
              <FilterChip
                key={chip.key}
                onRemove={() => onRemoveChip(chip.patch)}
                removeLabel={t("matches.filters.common.removeFilter")}
              >
                {chip.label}
              </FilterChip>
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
                "hover:text-foreground",
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
  );
}

export function MatchesPageSummary({
  filteredCount,
  pageFrom,
  pageTo,
}: MatchesPageSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="md:col-span-4 text-xs text-muted-foreground">
      {t("matches.filters.pageShowing", { from: pageFrom, to: pageTo, total: filteredCount })}
    </div>
  );
}
