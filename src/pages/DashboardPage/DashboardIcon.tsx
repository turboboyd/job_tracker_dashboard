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
  | "rejected";

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
  rejected: "⚠️",
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
  applied: "text-blue-600 dark:text-blue-400",
  saved: "text-amber-600 dark:text-amber-400",
  interview: "text-purple-600 dark:text-purple-400",
  offer: "text-emerald-600 dark:text-emerald-400",
  rejected: "text-red-600 dark:text-red-400",
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
