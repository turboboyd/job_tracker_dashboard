import type { EditSourcesGroupSectionProps } from "./editSourcesModal.types";

function getGroupButtonClassName(isAllSelected: boolean, isDisabled: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
    isAllSelected
      ? "border-primary/50 bg-primary/10 text-foreground"
      : "border-border bg-card text-muted-foreground",
    isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/40",
  ].join(" ");
}

export function EditSourcesGroupSection({
  disabled,
  isSaving,
  labels,
  onToggleGroup,
  rows,
}: EditSourcesGroupSectionProps) {
  const isInteractionDisabled = disabled || isSaving;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
      <div className="text-sm font-semibold text-foreground">{labels.groups}</div>

      <div className="flex flex-wrap gap-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onToggleGroup(row.id)}
            disabled={isInteractionDisabled}
            className={getGroupButtonClassName(
              row.isAllSelected,
              isInteractionDisabled,
            )}
          >
            <span className="font-medium">{row.title}</span>
            <span className="text-[11px] text-muted-foreground">
              {row.selectedCount}/{row.totalCount}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

