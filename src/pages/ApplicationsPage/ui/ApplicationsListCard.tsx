import React, { useState, useMemo, useEffect } from "react";
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
  return (
    <div className="flex gap-1 rounded-[7px] border border-border bg-muted p-0.5">
      {(["list", "cards"] as const).map((mode) => {
        const isActive = value === mode;
        const label = mode === "list" ? "Список" : "Карточки";
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
  const cols: { label: string; title?: string }[] = [
    { label: "" },
    { label: "Должность · Компания" },
    { label: "Локация" },
    { label: "Статус" },
    { label: "Цикл" },
    { label: "Матч", title: "AI match score: ≥85 strong, ≥70 good, <70 weak" },
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
  displayMode?: DisplayMode;
  onDisplayModeChange?: (v: DisplayMode) => void;
  selectedCompanies?: string[];
  onFilteredCount?: (count: number) => void;
}) {
  const { t } = useTranslation();
  const {
    list,
    view,
    query = "",
    sortBy = "newest",
    onChangeStatus,
    displayMode: displayModeProp,
    onDisplayModeChange,
    selectedCompanies,
    onFilteredCount,
  } = props;
  const [displayModeInternal, setDisplayModeInternal] = useState<DisplayMode>("list");
  const displayMode = displayModeProp ?? displayModeInternal;
  const setDisplayMode = onDisplayModeChange ?? setDisplayModeInternal;

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

  return (
    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
      {filteredSorted.length === 0 ? (
        <div className="px-3 py-6 text-sm text-muted-foreground">
          {query ? "No applications match your search." : emptyText}
        </div>
      ) : displayMode === "list" ? (
        <div>
          <ListHeader />
          <div>
            {filteredSorted.map((row) => (
              <ApplicationListItem
                key={row.id}
                row={row}
                onChangeStatus={onChangeStatus}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredSorted.map((row) => (
            <ApplicationCardTile key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
