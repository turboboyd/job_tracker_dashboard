import { Calendar } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "src/shared/ui/Button";

interface SegmentButtonProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

interface CustomRangeButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function SegmentButton({ active, children, onClick }: SegmentButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      shape="pill"
      shadow="none"
      className={[
        "h-9 px-3 text-xs",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Button>
  );
}

export function SegmentGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-full border bg-background p-1">
      {children}
    </div>
  );
}

export function CustomRangeButton({
  active,
  label,
  onClick,
}: CustomRangeButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      shape="pill"
      shadow="none"
      className={[
        "h-9 gap-2 px-3 text-xs",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      <Calendar className="h-4 w-4" />
      {label}
    </Button>
  );
}

