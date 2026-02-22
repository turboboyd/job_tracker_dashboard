import React from "react";

import { Button, PageHeader } from "src/shared/ui";

type Props = {
  title: string;
  subtitle: string;
  isPrivate: boolean;
  viewMode: "all" | "favorites";
  onSetViewMode: (mode: "all" | "favorites") => void;
  suggestHref: string;
  suggestLabel: string;
  allLabel: string;
  favoritesLabel: string;
};

export const ResourcesHeader: React.FC<Props> = ({
  title,
  subtitle,
  isPrivate,
  viewMode,
  onSetViewMode,
  suggestHref,
  suggestLabel,
  allLabel,
  favoritesLabel,
}) => {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      right={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {isPrivate ? (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                size="sm"
                shadow="none"
                onClick={() => onSetViewMode("all")}
              >
                {allLabel}
              </Button>
              <Button
                variant={viewMode === "favorites" ? "default" : "outline"}
                size="sm"
                shadow="none"
                onClick={() => onSetViewMode("favorites")}
              >
                {favoritesLabel}
              </Button>
            </div>
          ) : null}

          <a
            href={suggestHref}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-md text-sm font-medium text-foreground shadow-sm transition-colors duration-fast ease-ease-out hover:bg-muted/60"
          >
            {suggestLabel}
          </a>
        </div>
      }
    />
  );
};
