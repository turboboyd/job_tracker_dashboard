import type { ReactNode } from "react";

import { formatTs } from "./applicationDetails.helpers";
import type { ApplicationDetailsText } from "./applicationDetails.text";

export function DetailsCardTitle({ children }: { children: string }) {
  return <div className="text-base font-semibold">{children}</div>;
}

export function DetailsMutedMessage({ children }: { children: ReactNode }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}

export function DetailsValueBadge({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-border bg-muted px-3 py-1 text-[12px] font-medium text-foreground">
      {children}
    </div>
  );
}

export function DetailsField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-muted/35 px-3 py-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function formatOptionalTimestamp(value: unknown): string {
  const formatted = formatTs(value);
  return formatted ? ` (${formatted})` : "";
}

export function getBooleanLabel(
  value: boolean,
  text: ApplicationDetailsText,
): string {
  return value ? text.yes : text.no;
}

export function getMatchingListValue(
  values: string[],
  emptyValue: string,
): string {
  return values.length > 0 ? values.join(", ") : emptyValue;
}
