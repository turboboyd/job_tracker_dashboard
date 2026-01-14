import React from "react";

export function JobsListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-background p-3"
        >
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
