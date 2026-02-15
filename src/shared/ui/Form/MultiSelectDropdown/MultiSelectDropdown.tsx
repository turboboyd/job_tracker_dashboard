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
  clearLabel?: string;
  searchable?: boolean;
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

function SelectedChips<T extends string>(props: {
  selectedOptions: Array<MultiSelectOption<T>>;
  placeholder: string;
  onRemove: (v: T) => void;
}) {
  const { selectedOptions, placeholder, onRemove } = props;

  if (selectedOptions.length === 0) {
    return <span className="text-sm text-muted-foreground">{placeholder}</span>;
  }

  return (
    <>
      {selectedOptions.map((o) => (
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
              onRemove(o.value);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove"
          >
            ✕
          </button>
        </span>
      ))}
    </>
  );
}

function DropdownPanel<T extends string>(props: {
  open: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  searchable: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  valueCount: number;
  clearLabel: string;
  onClear: () => void;
  filteredOptions: Array<MultiSelectOption<T>>;
  selectedSet: Set<T>;
  disabled: boolean;
  onToggle: (v: T) => void;
  onClose: () => void;
}) {
  const {
    open,
    panelRef,
    searchable,
    query,
    onQueryChange,
    valueCount,
    clearLabel,
    onClear,
    filteredOptions,
    selectedSet,
    disabled,
    onToggle,
    onClose,
  } = props;

  if (!open) return null;

  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    onClose();
  };

  return (
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
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search…"
            className={classNames(
              "h-9 w-full rounded-lg border border-input bg-background px-sm text-sm",
              "outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          />
        ) : (
          <div className="text-xs text-muted-foreground">
            {valueCount > 0 ? `${valueCount} selected` : "No filters selected"}
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
              onClick={() => (itemDisabled ? undefined : onToggle(o.value))}
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
          <div className="px-sm py-3 text-sm text-muted-foreground">No results</div>
        ) : null}
      </div>
    </div>
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

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const selectedOptions = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o] as const));
    return value.map((v) => map.get(v)).filter(Boolean) as Array<MultiSelectOption<T>>;
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable) return options;

    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) => normalizeText(o.label).includes(q));
  }, [options, query, searchable]);

  const canAddMore = React.useCallback(
    (next: T[]) => (typeof maxSelected !== "number" ? true : next.length <= maxSelected),
    [maxSelected]
  );

  const onToggle = React.useCallback(
    (v: T) => {
      const next = toggle(value, v);
      if (canAddMore(next)) onChange(next);
    },
    [canAddMore, onChange, value]
  );

  const onClear = React.useCallback(() => onChange([]), [onChange]);

  const onRemove = React.useCallback(
    (v: T) => {
      onChange(value.filter((x) => x !== v));
    },
    [onChange, value]
  );

  const onKeyDownButton = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ": {
        e.preventDefault();
        setOpen((x) => !x);
        break;
      }
      case "Escape": {
        e.preventDefault();
        setOpen(false);
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        setOpen(true);
        window.setTimeout(() => panelRef.current?.focus(), 0);
        break;
      }
      default:
        break;
    }
  };

  const toggleOpen = React.useCallback(() => {
    if (!disabled) setOpen((x) => !x);
  }, [disabled]);

  const close = React.useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <div className={classNames("relative grid gap-1.5", className)}>
      {label ? (
        <label className="text-sm font-medium text-foreground">
          {label} {required ? <span className="text-destructive">*</span> : null}
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
        onClick={toggleOpen}
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
          <SelectedChips
            selectedOptions={selectedOptions}
            placeholder={placeholder}
            onRemove={onRemove}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 text-muted-foreground">
          <ChevronIcon open={open} />
        </div>
      </button>

      <DropdownPanel
        open={open}
        searchable={searchable}
        query={query}
        onQueryChange={setQuery}
        clearLabel={clearLabel}
        onClear={onClear}
        valueCount={value.length}
        filteredOptions={filteredOptions}
        selectedSet={selectedSet}
        disabled={disabled}
        onToggle={onToggle}
        onClose={close}
        panelRef={panelRef}
      />

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
