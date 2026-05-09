import type { ReactNode } from "react";

import { Card } from "src/shared/ui";

interface MatchDetailsPanelProps {
  children: ReactNode;
  title?: ReactNode;
}

export function MatchDetailsPanel({ children, title }: MatchDetailsPanelProps) {
  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      {title ? (
        <div className="text-base font-semibold text-foreground">{title}</div>
      ) : null}
      {children}
    </Card>
  );
}
