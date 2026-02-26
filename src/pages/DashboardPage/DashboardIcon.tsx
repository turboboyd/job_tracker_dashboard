import React from "react";

export type IconName =
  | "user"
  | "question"
  | "loop"
  | "add"
  | "total"
  | "new"
  | "applied"
  | "saved"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "no_response";

const ICONS: Record<IconName, string> = {
  user: "👤",
  question: "❓",
  loop: "🔁",
  add: "➕",

  total: "🔗",
  new: "🆕",
  applied: "📄",
  saved: "🔄",
  interview: "✉️",
  offer: "🎉",
  hired: "✅",
  rejected: "⚠️",
  no_response: "⏳",
};

const COLOR: Record<IconName, string> = {
  // Action rows
  user: "text-foreground",
  question: "text-foreground",
  loop: "text-foreground",
  add: "text-foreground",

  // KPI (по смыслу/статусу)
  total: "text-foreground",
  new: "text-slate-700 dark:text-slate-200",
  applied: "text-status-info",
  saved: "text-status-info",
  interview: "text-status-purple",
  offer: "text-status-warning",
  hired: "text-status-success",
  rejected: "text-status-danger",
  no_response: "text-status-neutral",
};

export type DashboardIconProps = {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
};

export function DashboardIcon({
  name,
  size = 18,
  className,
  title,
}: DashboardIconProps) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      style={{ fontSize: size }}
      className={[
        "leading-none",
        COLOR[name],
        className ?? "",
      ].join(" ").trim()}
    >
      {ICONS[name]}
    </span>
  );
}
