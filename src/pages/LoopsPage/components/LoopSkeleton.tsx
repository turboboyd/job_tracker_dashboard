export function LoopCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[14px] border border-border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-6">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted/70" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-14 rounded-full bg-muted" />
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <div className="h-3 w-32 rounded bg-muted/70" />
          <div className="flex gap-3.5">
            <div className="h-5 w-7 rounded bg-muted" />
            <div className="h-5 w-7 rounded bg-muted" />
            <div className="h-5 w-7 rounded bg-muted" />
          </div>
          <div className="h-7 w-20 rounded-[6px] bg-muted" />
        </div>
      </div>
    </div>
  );
}
