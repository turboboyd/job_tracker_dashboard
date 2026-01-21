import React from "react";

import type { Match } from "src/entities/match/model";

export function MatchesList({ items }: { items: Match[] }) {
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">No matches found.</div>;
  }

  return (
    <div className="space-y-sm">
      {items.map((m) => (
        <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium text-foreground">{m.title ?? "Untitled"}</div>
            <div className="text-xs text-muted-foreground">
              {m.platform ? String(m.platform) : ""}
              {m.status ? ` • ${String(m.status)}` : ""}
            </div>
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {m.company ? m.company : ""}
            {m.location ? ` • ${m.location}` : ""}
          </div>

          {m.description ? (
            <div className="mt-2 text-sm text-foreground/90">{m.description}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
