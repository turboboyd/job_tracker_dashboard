import { Card } from "src/shared/ui/Card";

import type { MatchDescriptionCardProps } from "./matchDetails.types";

export function MatchDescriptionCard({
  title,
  description,
}: MatchDescriptionCardProps) {
  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="mt-sm text-sm leading-relaxed whitespace-pre-wrap">
        {description}
      </div>
    </Card>
  );
}

