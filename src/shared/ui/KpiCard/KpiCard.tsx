import React from "react";

import { Card } from "src/shared/ui";

type Props = {
  title: React.ReactNode;
  value: number | string;
  icon?: React.ReactNode;
};

export function KpiCard({ title, value, icon }: Props) {
  return (
    <Card
      padding="md"
      shadow="sm"
      variant="default"
      className="flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground break-words [hyphens:auto]">
          {title}
        </div>
        <div className="mt-1 text-2xl font-semibold text-foreground break-words [hyphens:auto]">
          {value}
        </div>
      </div>

      {icon ? (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground">
          {icon}
        </div>
      ) : null}
    </Card>
  );
}
