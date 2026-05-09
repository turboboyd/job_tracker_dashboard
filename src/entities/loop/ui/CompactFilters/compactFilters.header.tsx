import { Button } from "src/shared/ui/Button";

import type { CompactFiltersLabels } from "./compactFilters.helpers";

function FilterBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

interface FiltersHeaderProps {
  badges: string[];
  disabled: boolean;
  labels: CompactFiltersLabels;
  onApply: () => void;
  onReset: () => void;
}

export function FiltersHeader({
  badges,
  disabled,
  labels,
  onApply,
  onReset,
}: FiltersHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-base font-semibold text-foreground">
          {labels.filtersTitle}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {labels.filtersSubtitle}
        </div>

        <FilterBadges badges={badges} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          shadow="sm"
          shape="lg"
          onClick={onApply}
          disabled={disabled}
        >
          {labels.apply}
        </Button>
        <Button
          variant="outline"
          shape="lg"
          onClick={onReset}
          disabled={disabled}
        >
          {labels.reset}
        </Button>
      </div>
    </div>
  );
}

