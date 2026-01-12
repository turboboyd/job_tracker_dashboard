import React from "react";

export function Loader() {
  return (
    <div className="p-6">
      <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <div className="text-sm font-medium">Loading page…</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Please wait
        </div>
      </div>
    </div>
  );
}
