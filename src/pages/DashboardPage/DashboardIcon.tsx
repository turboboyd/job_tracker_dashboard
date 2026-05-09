import {
  Bookmark,
  CheckCircle2,
  CircleHelp,
  FileText,
  Hourglass,
  MessageSquare,
  Plus,
  Repeat2,
  Send,
  Trophy,
  User,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconName =
  | "user"
  | "question"
  | "loop"
  | "add"
  | "total"
  | "new"
  | "applied"
  | "saved"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "no_response";

const ICONS: Record<IconName, LucideIcon> = {
  add: Plus,
  applied: Send,
  hired: CheckCircle2,
  interview: MessageSquare,
  loop: Repeat2,
  new: FileText,
  no_response: Hourglass,
  offer: Trophy,
  question: CircleHelp,
  rejected: XCircle,
  saved: Bookmark,
  total: FileText,
  user: User,
};

const TEXT_FOREGROUND = "text-foreground";

const COLOR: Record<IconName, string> = {
  add: TEXT_FOREGROUND,
  applied: "text-status-info",
  hired: "text-status-success",
  interview: "text-status-purple",
  loop: TEXT_FOREGROUND,
  new: "text-slate-700 dark:text-slate-200",
  no_response: "text-status-neutral",
  offer: "text-status-warning",
  question: TEXT_FOREGROUND,
  rejected: "text-status-danger",
  saved: "text-status-info",
  total: TEXT_FOREGROUND,
  user: TEXT_FOREGROUND,
};

export interface DashboardIconProps {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}

export function DashboardIcon({
  name,
  size = 18,
  className,
  title,
}: DashboardIconProps) {
  const Icon = ICONS[name];

  return (
    <Icon
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={["shrink-0", COLOR[name], className ?? ""].join(" ").trim()}
      size={size}
      strokeWidth={2}
    />
  );
}
