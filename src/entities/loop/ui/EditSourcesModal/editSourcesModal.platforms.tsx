import type { EditSourcesPlatformsSectionProps } from "./editSourcesModal.types";

function getPlatformRowClassName(checked: boolean, isDisabled: boolean) {
  return [
    "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
    checked ? "border-primary/40 bg-primary/5" : "border-border bg-card",
    isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/30",
  ].join(" ");
}

export function EditSourcesPlatformsSection({
  disabled,
  isSaving,
  labels,
  onTogglePlatform,
  rows,
}: EditSourcesPlatformsSectionProps) {
  const isInteractionDisabled = disabled || isSaving;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
      <div className="text-sm font-semibold text-foreground">
        {labels.platforms}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <label
            key={row.platform}
            className={getPlatformRowClassName(row.checked, isInteractionDisabled)}
          >
            <input
              type="checkbox"
              checked={row.checked}
              onChange={() => onTogglePlatform(row.platform)}
              disabled={isInteractionDisabled}
            />
            <span className="text-foreground">{row.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

