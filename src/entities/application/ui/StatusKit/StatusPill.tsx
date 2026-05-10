import React from "react";

import type { StatusKey } from "../../model/status";

import { StatusDot } from "./StatusDot";
import { StatusLabel } from "./StatusLabel";

function clsx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export interface StatusPillProps {
  status: StatusKey;
  className?: string;
  dotSize?: "xs" | "sm" | "md";
}

export function StatusPill({ status, className, dotSize = "sm" }: StatusPillProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground",
        className,
      )}
    >
      <StatusDot status={status} size={dotSize} />
      <span className="truncate">
        <StatusLabel status={status} />
      </span>
    </span>
  );
}
