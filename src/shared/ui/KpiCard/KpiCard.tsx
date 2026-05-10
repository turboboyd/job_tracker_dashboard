import React from "react";

import { classNames } from "src/shared/lib";

import { Card } from "../Card/Card";

interface Props {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
  trend?: React.ReactNode;
}

export function KpiCard({ title, value, icon, valueClassName, trend }: Props) {
  return (
    <Card
      padding="none"
      shadow="sm"
      variant="default"
      className="p-5 flex items-start justify-between gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {title}
        </div>
        <div
          className={classNames(
            "mt-2 whitespace-nowrap text-3xl font-semibold leading-none",
            valueClassName ?? "text-foreground"
          )}
        >
          {value}
        </div>
        {trend ? (
          <div className="mt-2 text-xs text-muted-foreground">{trend}</div>
        ) : null}
      </div>

      {icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
    </Card>
  );
}
