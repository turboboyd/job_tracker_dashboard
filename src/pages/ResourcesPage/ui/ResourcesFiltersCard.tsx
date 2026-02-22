import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Card, SectionHeader } from "src/shared/ui";

import type { ResourceCategory } from "../model/types";
import type { CategoryOption } from "../model/useResourcesPage";

type Props = {
  resultsText: string;
  isPrivate: boolean;
  favIsFetching: boolean;
  favoritesCountText: string;

  query: string;
  onQueryChange: (value: string) => void;

  onReset: () => void;

  category: ResourceCategory;
  onSelectCategory: (key: ResourceCategory) => void;
  categoryOptions: CategoryOption[];
};

export const ResourcesFiltersCard: React.FC<Props> = ({
  resultsText,
  isPrivate,
  favIsFetching,
  favoritesCountText,
  query,
  onQueryChange,
  onReset,
  category,
  onSelectCategory,
  categoryOptions,
}) => {
  const { t } = useTranslation();
  return (
    <Card padding="md" shadow="sm" className="space-y-4">
      <SectionHeader
        title={t("resources.filters.title", "Find what you need")}
        subtitle={t(
          "resources.filters.subtitle",
          "Filter by category or search by keywords.",
        )}
        right={
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{resultsText}</span>
            {isPrivate ? (
              <>
                <span className="hidden sm:inline">•</span>
                <span>
                  {favIsFetching
                    ? t("resources.favorites.loading", "Loading…")
                    : favoritesCountText}
                </span>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="w-full">
          <div className="mb-1 text-xs text-muted-foreground">
            {t("resources.search.label", "Search")}
          </div>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t(
              "resources.search.placeholder",
              "ATS, STAR, React, remote…",
            )}
            className={[
              "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground",
              "placeholder:text-muted-foreground outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
          />
        </label>

        <div className="flex gap-2 md:justify-end">
          <Button
            variant="outline"
            size="default"
            shadow="none"
            onClick={onReset}
            className="w-full md:w-auto"
          >
            {t("resources.actions.reset", "Reset")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((c) => {
          const active = c.key === category;
          return (
            <Button
              key={c.key}
              variant={active ? "default" : "outline"}
              size="sm"
              shadow="none"
              onClick={() => onSelectCategory(c.key)}
            >
              {c.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
