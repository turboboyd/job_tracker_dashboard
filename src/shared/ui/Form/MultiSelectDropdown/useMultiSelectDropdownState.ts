import React from "react";

import {
  normalizeText,
  toggle,
  type MultiSelectOption,
} from "./multiSelectDropdown.helpers";

interface UseMultiSelectDropdownStateParams<T extends string> {
  disabled: boolean;
  maxSelected: number | undefined;
  onChange: (next: T[]) => void;
  options: MultiSelectOption<T>[];
  searchable: boolean;
  value: T[];
}

export function useMultiSelectDropdownState<T extends string>({
  disabled,
  maxSelected,
  onChange,
  options,
  searchable,
  value,
}: UseMultiSelectDropdownStateParams<T>) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const selectedOptions = React.useMemo(() => {
    const map = new Map(options.map((option) => [option.value, option] as const));
    return value
      .map((selectedValue) => map.get(selectedValue))
      .filter(Boolean) as MultiSelectOption<T>[];
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable) return options;

    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return options;

    return options.filter((option) =>
      normalizeText(option.label).includes(trimmedQuery),
    );
  }, [options, query, searchable]);

  const canAddMore = React.useCallback(
    (next: T[]) =>
      typeof maxSelected !== "number" ? true : next.length <= maxSelected,
    [maxSelected],
  );

  const onToggle = React.useCallback(
    (selectedValue: T) => {
      const next = toggle(value, selectedValue);
      if (canAddMore(next)) onChange(next);
    },
    [canAddMore, onChange, value],
  );

  const onClear = React.useCallback(() => onChange([]), [onChange]);

  const onRemove = React.useCallback(
    (selectedValue: T) => {
      onChange(value.filter((item) => item !== selectedValue));
    },
    [onChange, value],
  );

  const onKeyDownButton = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case "Enter":
        case " ": {
          event.preventDefault();
          setOpen((isOpen) => !isOpen);
          break;
        }
        case "Escape": {
          event.preventDefault();
          setOpen(false);
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          setOpen(true);
          window.setTimeout(() => panelRef.current?.focus(), 0);
          break;
        }
        default:
          break;
      }
    },
    [disabled],
  );

  const toggleOpen = React.useCallback(() => {
    if (!disabled) setOpen((isOpen) => !isOpen);
  }, [disabled]);

  const close = React.useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return {
    buttonRef,
    close,
    filteredOptions,
    onClear,
    onKeyDownButton,
    onRemove,
    onToggle,
    open,
    panelRef,
    query,
    selectedOptions,
    selectedSet,
    setQuery,
    toggleOpen,
  };
}

