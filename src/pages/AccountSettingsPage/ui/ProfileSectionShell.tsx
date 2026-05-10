import type { ReactNode } from "react";

import { Card } from "src/shared/ui";

interface ProfileSectionShellProps {
  children: ReactNode;
  className?: string;
  title: string;
}

export function ProfileSectionShell({
  children,
  className,
  title,
}: ProfileSectionShellProps) {
  return (
    <Card className={["p-4", "flex flex-col", className ?? ""].join(" ")}>
      <div className="mb-3 text-sm font-semibold text-foreground">{title}</div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}
