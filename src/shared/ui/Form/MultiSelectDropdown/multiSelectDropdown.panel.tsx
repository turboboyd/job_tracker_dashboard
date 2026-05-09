import type { RefObject } from "react";
import React from "react";

import { classNames } from "src/shared/lib";

import type { MultiSelectOption } from "./multiSelectDropdown.helpers";
import { CheckIcon } from "./multiSelectDropdown.icons";

interface DropdownPanelProps<T extends string> {
  clearLabel: string;
  disabled: boolean;
  filteredOptions: MultiSelectOption<T>[];
  onClear: () => void;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onToggle: (value: T) => void;
  open: boolean;
  panelRef: RefObject<HTMLDivElement>;
  query: string;
  searchable: boolean;
  selectedSet: Set<T>;
  valueCount: number;
}

export function DropdownPanel<T extends string>({
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
}: DropdownPanelProps<T>) {
  if (!open) return null;

  const onKeyDownPanel = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
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
        "outline-none",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-sm py-2">
        {searchable ? (
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search…"
            className={classNames(
              "h-9 w-full rounded-lg border border-input bg-background px-sm text-sm",
              "outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
        {filteredOptions.map((option) => {
          const checked = selectedSet.has(option.value);
          const itemDisabled = disabled || Boolean(option.disabled);

          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={itemDisabled}
              onClick={() => (itemDisabled ? undefined : onToggle(option.value))}
              className={classNames(
                "w-full",
                "flex items-center gap-3 px-sm py-3 text-left",
                "transition-colors",
                checked ? "bg-muted" : "hover:bg-muted/60",
                "disabled:opacity-50 disabled:pointer-events-none",
                "cursor-pointer disabled:cursor-not-allowed",
              )}
              role="option"
              aria-selected={checked}
            >
              <span
                className={classNames(
                  "flex h-6 w-6 items-center justify-center rounded-md border",
                  checked ? "border-foreground text-foreground" : "border-border text-transparent",
                )}
                aria-hidden="true"
              >
                {checked ? <CheckIcon /> : null}
              </span>

              <span className="text-sm text-foreground">{option.label}</span>
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
