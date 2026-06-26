import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { ProcessStatus } from "../api/applicationsRepo";
import type { ViewMode } from "../model/types";
import type { AppRow } from "../model/useApplicationsPage";

import { ApplicationCardTile, ApplicationListItem } from "./ApplicationListItem";

// ─── View toggle ─────────────────────────────────────────────────────────────

type DisplayMode = "list" | "cards";

function ViewToggle({
  value,
  onChange,
}: {
  value: DisplayMode;
  onChange: (v: DisplayMode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1 rounded-[7px] border border-border bg-muted p-0.5">
      {(["list", "cards"] as const).map((mode) => {
        const isActive = value === mode;
        const label =
          mode === "list"
            ? t("applicationsPage.displayMode.list", "List")
            : t("applicationsPage.displayMode.cards", "Cards");
        return (
          <span
            key={mode}
            role="button"
            tabIndex={0}
            onClick={() => onChange(mode)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange(mode)}
            className={[
              "cursor-pointer rounded-[5px] px-[10px] py-[4px] text-[11.5px] transition-colors duration-100 select-none",
              isActive
                ? "border border-border bg-card font-medium text-foreground"
                : "text-subtle-foreground",
            ].join(" ")}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Table header ─────────────────────────────────────────────────────────────

function ListHeader() {
  const { t } = useTranslation();
  const cols: { label: string; title?: string }[] = [
    { label: "" },
    { label: t("applicationsPage.columns.role", "Role · Company") },
    { label: t("applicationsPage.columns.location", "Location") },
    { label: t("applicationsPage.columns.status", "Status") },
    { label: t("applicationsPage.columns.direction", "Direction") },
    {
      label: t("applicationsPage.columns.match", "Match"),
      title: t(
        "applicationsPage.columns.matchTitle",
        "AI match score: ≥85 strong, ≥70 good, <70 weak",
      ),
    },
    { label: "" },
  ];

  return (
    <div
      className="grid items-center gap-3 border-b border-border bg-muted px-3 py-[6px]"
      style={{ gridTemplateColumns: "32px 2.4fr 1.2fr 120px 110px 90px 30px" }}
    >
      {cols.map((col, i) => (
        <span
          key={i}
          title={col.title}
          className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground"
        >
          {col.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export { ViewToggle };

export function ApplicationsListCard(props: {
  list: AppRow[];
  view: ViewMode;
  query?: string;
  sortBy?: "newest" | "oldest" | "company" | "score";
  onChangeStatus?: (appId: string, status: ProcessStatus) => void;
  onToggleFavorite?: (appId: string, nextValue: boolean) => void;
  onArchiveApplication?: (appId: string) => void;
  onRestoreApplication?: (appId: string) => void;
  isArchivedView?: boolean;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (v: DisplayMode) => void;
  selectedCompanies?: string[];
  onFilteredCount?: (count: number) => void;
  loopTitleById: ReadonlyMap<string, string>;
}) {
  const { t } = useTranslation();
  const {
    list,
    view,
    query = "",
    sortBy = "newest",
    onChangeStatus,
    onToggleFavorite,
    onArchiveApplication,
    onRestoreApplication,
    isArchivedView = false,
    displayMode: displayModeProp,
    selectedCompanies,
    onFilteredCount,
    loopTitleById,
  } = props;
  const displayMode = displayModeProp ?? "list";

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Filter by search query
    let result = q
      ? list.filter((row) => {
          const { job } = row.data;
          return (
            job.companyName.toLowerCase().includes(q) ||
            job.roleTitle.toLowerCase().includes(q) ||
            (job.locationText ?? "").toLowerCase().includes(q)
          );
        })
      : list;

    // Filter by selected companies
    if (selectedCompanies && selectedCompanies.length > 0) {
      result = result.filter((row) =>
        selectedCompanies.includes(row.data.job.companyName)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            (a.data.createdAt?.toDate?.()?.getTime() ?? 0) -
            (b.data.createdAt?.toDate?.()?.getTime() ?? 0)
          );
        case "company":
          return a.data.job.companyName.localeCompare(b.data.job.companyName);
        case "score":
          return (b.data.matching?.score ?? 0) - (a.data.matching?.score ?? 0);
        case "newest":
        default:
          return (
            (b.data.createdAt?.toDate?.()?.getTime() ?? 0) -
            (a.data.createdAt?.toDate?.()?.getTime() ?? 0)
          );
      }
    });

    return result;
  }, [list, query, sortBy, selectedCompanies]);

  // Report filtered count to parent
  useEffect(() => {
    onFilteredCount?.(filteredSorted.length);
  }, [filteredSorted.length, onFilteredCount]);

  let emptyText: string;
  if (view === "today") {
    emptyText =
      (t("applicationsPage.empty.today", {
        defaultValue: "Nothing for today.",
        returnObjects: false,
      }) ?? "Nothing for today.") as string;
  } else if (view === "followups") {
    emptyText =
      (t("applicationsPage.empty.followups", {
        defaultValue: "No follow-ups due.",
        returnObjects: false,
      }) ?? "No follow-ups due.") as string;
  } else {
    emptyText =
      (t("applicationsPage.empty.pipeline", {
        defaultValue: "No applications yet.",
        returnObjects: false,
      }) ?? "No applications yet.") as string;
  }

  // Card body — extracted from a nested ternary into an ordered if/else
  // (sonarjs/no-nested-conditional). Branch order (empty → list → grid),
  // conditions, text, props and class names are unchanged.
  function renderBody() {
    if (filteredSorted.length === 0) {
      return (
        <div className="px-3 py-6 text-sm text-muted-foreground">
          {query ? t("applicationsPage.list.noMatch", "No applications match your search.") : emptyText}
        </div>
      );
    }
    if (displayMode === "list") {
      return (
        <div>
          <ListHeader />
          <div>
            {filteredSorted.map((row) => (
              <ApplicationListItem
                key={row.id}
                row={row}
                onChangeStatus={onChangeStatus}
                onToggleFavorite={onToggleFavorite}
                onArchiveApplication={onArchiveApplication}
                onRestoreApplication={onRestoreApplication}
                isArchivedView={isArchivedView}
                loopTitleById={loopTitleById}
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-3 p-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {filteredSorted.map((row) => (
          <ApplicationCardTile
            key={row.id}
            row={row}
            onToggleFavorite={onToggleFavorite}
            onArchiveApplication={onArchiveApplication}
            onRestoreApplication={onRestoreApplication}
            isArchivedView={isArchivedView}
            loopTitleById={loopTitleById}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
      {renderBody()}
    </div>
  );
}
