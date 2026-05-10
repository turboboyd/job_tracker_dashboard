import React from "react";

import { getStageColorForStatus, STATUS_COLOR_DOT_CLASS, type StatusKey } from "../../model/status";

function clsx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export interface StatusDotProps {
  status: StatusKey;
  className?: string;
  size?: "xs" | "sm" | "md";
}

const SIZE_CLASS: Record<NonNullable<StatusDotProps["size"]>, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

export function StatusDot({ status, className, size = "sm" }: StatusDotProps) {
  const color = getStageColorForStatus(status);
  return (
    <span
      aria-hidden
      className={clsx("inline-block rounded-full", SIZE_CLASS[size], STATUS_COLOR_DOT_CLASS[color], className)}
    />
  );
}
