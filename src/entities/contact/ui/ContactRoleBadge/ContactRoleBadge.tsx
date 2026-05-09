import { classNames } from "src/shared/lib";

import { CONTACT_ROLE_LABELS } from "../../model/contact.constants";
import type { ContactRole } from "../../model/primitive.types";

interface ContactRoleBadgeProps {
  role: ContactRole;
  className?: string;
}

const roleColorMap: Record<ContactRole, string> = {
  HR: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  RECRUITER: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  TECH_INTERVIEWER: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  HIRING_MANAGER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  REFERRAL: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  OTHER: "bg-muted text-muted-foreground",
};

export function ContactRoleBadge({ role, className }: ContactRoleBadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        roleColorMap[role],
        className,
      )}
    >
      {CONTACT_ROLE_LABELS[role]}
    </span>
  );
}
