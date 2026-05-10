import React from "react";

export function Loader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Spinner */}
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        <div className="text-sm font-medium text-muted-foreground">Loading…</div>
      </div>
    </div>
  );
}
