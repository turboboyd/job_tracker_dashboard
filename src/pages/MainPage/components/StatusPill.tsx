import React from "react";

export type StatusTone = "success" | "warning" | "info";

type Props = {
  label: string;
  tone: StatusTone;
  className?: string;
};

export const StatusPill: React.FC<Props> = ({ label, tone, className }) => {
  let toneClass: string;

  if (tone === "success") {
    toneClass = "bg-success text-success-foreground";
  } else if (tone === "warning") {
    toneClass = "bg-warning text-warning-foreground";
  } else {
    toneClass = "bg-info text-info-foreground";
  }

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
