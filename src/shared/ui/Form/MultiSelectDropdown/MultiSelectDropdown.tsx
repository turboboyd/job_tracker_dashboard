import React from "react";

import { classNames } from "src/shared/lib";

export type MultiSelectOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export type MultiSelectDropdownProps<T extends string> = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;

  value: T[];
  onChange: (next: T[]) => void;

  options: Array<MultiSelectOption<T>>;

  placeholder?: string;
  clearLabel?: string; // текст кнопки сброса внутри дропдауна
  searchable?: boolean; // поиск по опциям внутри дропдауна
  maxSelected?: number;

  disabled?: boolean;

  className?: string;
};

function hasNode(v: React.ReactNode) {
  return v !== null && v !== undefined && v !== false && v !== "";
}

function normalizeText(v: React.ReactNode): string {
  if (typeof v === "string") return v.toLowerCase();
  if (typeof v === "number") return String(v).toLowerCase();
  return "";
}

function toggle<T extends string>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// function useClickOutside(
//   refs: Array<React.RefObject<HTMLElement>>,
//   onOutside: () => void,
//   active: boolean
// ) {
//   React.useEffect(() => {
//     if (!active) return;

//     const onDown = (e: MouseEvent | TouchEvent) => {
//       const target = e.target as Node | null;
//       if (!target) return;

//       const inside = refs.some((r) => r.current && r.current.contains(target));
//       if (!inside) onOutside();
//     };

//     document.addEventListener("mousedown", onDown);
//     document.addEventListener("touchstart", onDown);

//     return () => {
//       document.removeEventListener("mousedown", onDown);
//       document.removeEventListener("touchstart", onDown);
//     };
//   }, [active, onOutside, refs]);
// }

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.5 11.2 3.6 8.3l-1 1 3.9 3.9L13.4 6.3l-1-1z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={classNames(
        "transition-transform",
        open ? "rotate-180" : "rotate-0"
      )}
    >
      <path
        d="M5.3 7.7a1 1 0 0 1 1.4 0L10 11l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MultiSelectDropdown<T extends string>({
  label,
  hint,
  error,
  required,

  value,
  onChange,
  options,

  placeholder = "Select…",
  clearLabel = "Clear",
  searchable = false,
  maxSelected,

  disabled = false,

  className,
}: MultiSelectDropdownProps<T>) {
  const id = React.useId();
  const hasError = Boolean(error);
  const message = error ?? hint;
  const describedBy = hasNode(message) ? `${id}__message` : undefined;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

 
  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const selectedOptions = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return value.map((v) => map.get(v)).filter(Boolean) as Array<
      MultiSelectOption<T>
    >;
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) => {
      const t = normalizeText(o.label);
      return t.includes(q);
    });
  }, [options, query, searchable]);

  const canAddMore = (next: T[]) =>
    typeof maxSelected !== "number" ? true : next.length <= maxSelected;

  const onToggle = (v: T) => {
    const next = toggle(value, v);
    if (canAddMore(next)) onChange(next);
  };

  const onClear = () => onChange([]);

  const removeOne = (v: T) => onChange(value.filter((x) => x !== v));

  const onKeyDownButton = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((x) => !x);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      window.setTimeout(() => panelRef.current?.focus(), 0);
      return;
    }
  };

  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={classNames("relative grid gap-1.5", className)}
    >
      {label ? (
        <label className="text-sm font-medium text-foreground">
          {label}{" "}
          {required ? <span className="text-destructive">*</span> : null}
        </label>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-invalid={hasError ? true : undefined}
        onClick={() => (disabled ? null : setOpen((x) => !x))}
        onKeyDown={onKeyDownButton}
        className={classNames(
          "w-full",
          "flex items-center gap-2",
          "border border-input bg-background text-foreground",
          "shadow-sm",
          "rounded-xl",
          "px-sm py-2",
          "outline-none transition-colors duration-fast ease-ease-out",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none",

          "cursor-pointer disabled:cursor-not-allowed",

          hasError
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input"
        )}
      >
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((o) => (
              <span
                key={String(o.value)}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
              >
                <span className="max-w-[160px] truncate">{o.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeOne(o.value);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 text-muted-foreground">
          <ChevronIcon open={open} />
        </div>
      </button>

      {open ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={onKeyDownPanel}
          className={classNames(
            "absolute left-0 top-full z-50 mt-2 w-full",
            "rounded-xl border border-border bg-background shadow-lg",
            "outline-none"
          )}
        >
          <div className="flex items-center justify-between gap-2 px-sm py-2">
            {searchable ? (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className={classNames(
                  "h-9 w-full rounded-lg border border-input bg-background px-sm text-sm",
                  "outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              />
            ) : (
              <div className="text-xs text-muted-foreground">
                {value.length > 0
                  ? `${value.length} selected`
                  : "No filters selected"}
              </div>
            )}

            <button
              type="button"
              onClick={onClear}
              className="whitespace-nowrap rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {clearLabel}
            </button>
          </div>

          <div className="max-h-[320px] overflow-auto py-1">
            {filteredOptions.map((o) => {
              const checked = selectedSet.has(o.value);
              const itemDisabled = disabled || Boolean(o.disabled);

              return (
                <button
                  key={String(o.value)}
                  type="button"
                  disabled={itemDisabled}
                  onClick={() => (itemDisabled ? null : onToggle(o.value))}
                  className={classNames(
                    "w-full",
                    "flex items-center gap-3 px-sm py-3 text-left",
                    "transition-colors",
                    checked ? "bg-muted" : "hover:bg-muted/60",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "cursor-pointer disabled:cursor-not-allowed"
                  )}
                  role="option"
                  aria-selected={checked}
                >
                  <span
                    className={classNames(
                      "flex h-6 w-6 items-center justify-center rounded-md border",
                      checked
                        ? "border-foreground text-foreground"
                        : "border-border text-transparent"
                    )}
                    aria-hidden="true"
                  >
                    {checked ? <CheckIcon /> : null}
                  </span>

                  <span className="text-sm text-foreground">{o.label}</span>
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <div className="px-sm py-3 text-sm text-muted-foreground">
                No results
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasNode(message) ? (
        <div
          id={describedBy}
          className={classNames(
            "text-xs",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
