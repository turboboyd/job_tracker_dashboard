import { Edit2, Loader2 } from "lucide-react";
import { useState } from "react";

// TODO(backend-migration): Replace with REST API call when migrating from Firebase.
// Currently uses Firestore direct SDK (firebase/firestore).
// Migration target: PATCH /api/v1/applications/{app_id}

export type SalaryFieldProps = {
  salary?: { currency?: string; min?: number; max?: number };
  onSave: (salary: { currency: string; min?: number; max?: number }) => Promise<void>;
  disabled?: boolean;
};

const CURRENCIES = ["€", "$", "£", "CHF", "other"];

function formatSalary(salary?: { currency?: string; min?: number; max?: number }): string {
  if (!salary || (salary.min == null && salary.max == null)) return "—";
  const currency = salary.currency ?? "€";
  const formatNum = (n: number) =>
    n.toLocaleString("en", { useGrouping: true }).replace(/,/g, " ");
  if (salary.min != null && salary.max != null) {
    return `${currency} ${formatNum(salary.min)} – ${formatNum(salary.max)}`;
  }
  if (salary.min != null) return `${currency} ${formatNum(salary.min)}+`;
  if (salary.max != null) return `Up to ${currency} ${formatNum(salary.max!)}`;
  return "—";
}

export function SalaryField({ salary, onSave, disabled = false }: SalaryFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currency, setCurrency] = useState(salary?.currency ?? "€");
  const [minVal, setMinVal] = useState(salary?.min != null ? String(salary.min) : "");
  const [maxVal, setMaxVal] = useState(salary?.max != null ? String(salary.max) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    if (disabled || isSaving) return;
    setCurrency(salary?.currency ?? "€");
    setMinVal(salary?.min != null ? String(salary.min) : "");
    setMaxVal(salary?.max != null ? String(salary.max) : "");
    setSaveError(null);
    setIsEditing(true);
  }

  function cancel() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function save() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const min = minVal.trim() !== "" ? parseFloat(minVal) : undefined;
      const max = maxVal.trim() !== "" ? parseFloat(maxVal) : undefined;
      await onSave({ currency, min, max });
      setIsEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="group relative">
      {/* Label row */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">
          Salary
        </span>
        {!disabled && !isEditing && (
          <button
            type="button"
            aria-label="Edit salary"
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={startEdit}
          >
            <Edit2 className="h-3 w-3" />
          </button>
        )}
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {/* Display mode */}
      {!isEditing && (
        <div
          role={disabled ? undefined : "button"}
          tabIndex={disabled ? undefined : 0}
          className={[
            "text-[13px] transition-colors",
            salary?.min != null || salary?.max != null
              ? "text-foreground cursor-pointer hover:text-primary"
              : "text-muted-foreground cursor-pointer hover:text-primary",
            disabled ? "cursor-default hover:text-foreground" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={startEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") startEdit();
          }}
        >
          {formatSalary(salary)}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-2">
          {/* Currency selector */}
          <div className="flex flex-wrap gap-1">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={[
                  "rounded-[5px] border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  currency === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Min / Max inputs */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              placeholder="Min"
              className="w-full rounded-[7px] border border-primary bg-background px-2.5 py-1.5 text-[13px] text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground text-[13px]">–</span>
            <input
              type="number"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              placeholder="Max"
              className="w-full rounded-[7px] border border-primary bg-background px-2.5 py-1.5 text-[13px] text-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save()}
              className="rounded-[5px] bg-primary px-2 py-0.5 text-[11px] text-primary-foreground disabled:opacity-50"
            >
              ✓
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={cancel}
              className="rounded-[5px] border border-border px-2 py-0.5 text-[11px] text-foreground disabled:opacity-50"
            >
              ✕
            </button>
          </div>
          {saveError && (
            <p className="text-[11px] text-destructive">{saveError}</p>
          )}
        </div>
      )}
    </div>
  );
}
