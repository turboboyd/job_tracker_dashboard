import type { TFunction } from "i18next";

function FilterBadge({ badge }: { badge: string }) {
  return (
    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      {badge}
    </span>
  );
}

export function DesktopAppliedBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:flex flex-wrap gap-2">
      {badges.map((badge) => (
        <FilterBadge key={badge} badge={badge} />
      ))}
    </div>
  );
}

export function MobileAppliedBadges({
  badges,
  t,
}: {
  badges: string[];
  t: TFunction;
}) {
  return (
    <details className="sm:hidden">
      <summary className="cursor-pointer select-none text-sm text-muted-foreground">
        {t("loops.filters", "Filters")} ({badges.length})
      </summary>

      {badges.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <FilterBadge key={badge} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">
          {t("loops.noFilters", "No filters applied")}
        </div>
      )}
    </details>
  );
}

