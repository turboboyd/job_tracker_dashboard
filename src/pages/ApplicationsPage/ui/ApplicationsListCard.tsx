import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const cols = [
    "",
    "Должность · Компания",
    "Локация",
    "Статус",
    "Цикл",
    "Матч",
    "",
  ];

  return (
    <div
      className="grid items-center gap-3 border-b border-border bg-muted px-3 py-[6px]"
      style={{ gridTemplateColumns: "32px 2.4fr 1.2fr 110px 110px 90px 30px" }}
    >
      {cols.map((col, i) => (
        <span
          key={i}
          className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground"
        >
          {col}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ApplicationsListCard(props: { list: AppRow[]; view: ViewMode }) {
  const { t } = useTranslation();
  const { list, view } = props;
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");

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
      {/* Card toolbar: count + view toggle */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border">
        <span className="text-[12px] text-muted-foreground">
          {list.length > 0
            ? `${list.length} ${t("applicationsPage.items", { defaultValue: "applications" })}`
            : null}
        </span>
        <ViewToggle value={displayMode} onChange={setDisplayMode} />
      </div>

      {list.length === 0 ? (
        <div className="px-3 py-6 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : displayMode === "list" ? (
        <div>
          <ListHeader />
          <div>
            {list.map((row) => (
              <ApplicationListItem key={row.id} row={row} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {list.map((row) => (
            <ApplicationCardTile key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
