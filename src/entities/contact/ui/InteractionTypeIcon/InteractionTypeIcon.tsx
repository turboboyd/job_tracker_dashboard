import { Mail, MessageSquare, Phone, Users, Zap } from "lucide-react";
import type { ElementType } from "react";

import { classNames } from "src/shared/lib";

import type { InteractionType } from "../../model/primitive.types";

interface InteractionTypeIconProps {
  type: InteractionType;
  className?: string;
  size?: number;
}

const iconMap: Record<InteractionType, ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MESSAGE: MessageSquare,
  MEETING: Users,
  OTHER: Zap,
};

const colorMap: Record<InteractionType, string> = {
  CALL: "text-blue-500",
  EMAIL: "text-violet-500",
  MESSAGE: "text-emerald-500",
  MEETING: "text-amber-500",
  OTHER: "text-muted-foreground",
};

const bgMap: Record<InteractionType, string> = {
  CALL: "bg-blue-50 dark:bg-blue-950/30",
  EMAIL: "bg-violet-50 dark:bg-violet-950/30",
  MESSAGE: "bg-emerald-50 dark:bg-emerald-950/30",
  MEETING: "bg-amber-50 dark:bg-amber-950/30",
  OTHER: "bg-muted/40",
};

export function InteractionTypeIcon({
  type,
  className,
  size = 16,
}: InteractionTypeIconProps) {
  const Icon = iconMap[type];

  return (
    <div
      className={classNames(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        bgMap[type],
        className,
      )}
    >
      <Icon
        className={classNames("shrink-0", colorMap[type])}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    </div>
  );
}
