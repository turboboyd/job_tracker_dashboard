import { useRef, useState } from "react";
import { Edit2, Loader2 } from "lucide-react";

// TODO(backend-migration): Replace with REST API call when migrating from Firebase.
// Currently uses Firestore direct SDK (firebase/firestore).
// Migration target: POST /api/applications/:appId (PATCH semantics)

export type InlineFieldProps = {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "url" | "number";
  formatDisplay?: (v: string) => string;
  disabled?: boolean;
};

export function InlineField({
  label,
  value,
  onSave,
  placeholder = "—",
  multiline = false,
  type = "text",
  formatDisplay,
  disabled = false,
}: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function startEdit() {
    if (disabled || isSaving) return;
    setDraft(value);
    setSaveError(null);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancel() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function save() {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      void save();
    }
    if (e.key === "Escape") {
      cancel();
    }
  }

  const displayValue = formatDisplay ? formatDisplay(value) : value;

  return (
    <div className="group relative">
      {/* Label row */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">
          {label}
        </span>
        {!disabled && !isEditing && (
          <button
            type="button"
            aria-label={`Edit ${label}`}
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
            value
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
          {displayValue || placeholder}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-1.5">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full rounded-[7px] border border-primary bg-background px-2.5 py-1.5 text-[13px] text-foreground focus:outline-none resize-y"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-[7px] border border-primary bg-background px-2.5 py-1.5 text-[13px] text-foreground focus:outline-none"
            />
          )}
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
