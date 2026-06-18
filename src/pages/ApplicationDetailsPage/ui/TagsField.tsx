import { Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

// Backend migration: replace with a REST API call when migrating from Firebase.
// Currently uses Firestore direct SDK (firebase/firestore).
// Migration target: PATCH /api/v1/applications/{app_id}

export type TagsFieldProps = {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
  disabled?: boolean;
};

export function TagsField({ tags, onSave, disabled = false }: TagsFieldProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdd() {
    if (disabled || isSaving) return;
    setDraft("");
    setSaveError(null);
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function removeTag(tag: string) {
    if (disabled || isSaving) return;
    const next = tags.filter((t) => t !== tag);
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(next);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function commitTag() {
    const tag = draft.trim();
    if (!tag) {
      setIsAdding(false);
      return;
    }
    if (tags.includes(tag)) {
      setDraft("");
      setIsAdding(false);
      return;
    }
    const next = [...tags, tag];
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(next);
      setDraft("");
      setIsAdding(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commitTag();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setDraft("");
    }
  }

  return (
    <div>
      {/* Label row */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">
          Tags
        </span>
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11.5px] text-foreground"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => void removeTag(tag)}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}

        {/* Add tag input */}
        {isAdding ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => void commitTag()}
            placeholder="New tag…"
            className="rounded-[7px] border border-primary bg-background px-2.5 py-0.5 text-[12px] text-foreground focus:outline-none w-24"
          />
        ) : (
          !disabled && (
            <button
              type="button"
              aria-label="Add tag"
              onClick={startAdd}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[11.5px] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Plus className="h-2.5 w-2.5" />
              Add tag
            </button>
          )
        )}
      </div>

      {saveError && (
        <p className="mt-1 text-[11px] text-destructive">{saveError}</p>
      )}
    </div>
  );
}
