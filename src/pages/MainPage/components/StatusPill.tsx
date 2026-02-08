import React from "react";

export type StatusTone = "success" | "warning" | "info";

type Props = {
  label: string;
  tone: StatusTone;
  className?: string;
};

export const StatusPill: React.FC<Props> = ({ label, tone, className }) => {
  const toneClass =
    tone === "success"
      ? "bg-success text-success-foreground"
      : tone === "warning"
      ? "bg-warning text-warning-foreground"
      : "bg-info text-info-foreground";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-sm py-1 text-[11px] font-medium",
        toneClass,
        className ?? "",
      ].join(" ")}
    >
      {label}
    </span>
  );
};
