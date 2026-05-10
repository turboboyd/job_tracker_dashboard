import React from 'react';

import { classNames } from 'src/shared/lib';

import {
  hasNode,
  type MultiSelectOption,
} from './multiSelectDropdown.helpers';
import {
  ChevronIcon,
  DropdownPanel,
  SelectedChips,
} from './multiSelectDropdown.sections';
import { useMultiSelectDropdownState } from './useMultiSelectDropdownState';

export interface MultiSelectDropdownProps<T extends string> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  value: T[];
  onChange: (next: T[]) => void;
  options: MultiSelectOption<T>[];
  placeholder?: string;
  clearLabel?: string;
  searchable?: boolean;
  maxSelected?: number;
  disabled?: boolean;
  className?: string;
}

export type { MultiSelectOption } from './multiSelectDropdown.helpers';

export function MultiSelectDropdown<T extends string>({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  clearLabel = 'Clear',
  searchable = false,
  maxSelected,
  disabled = false,
  className,
}: MultiSelectDropdownProps<T>) {
  const id = React.useId();
  const hasError = Boolean(error);
  const message = error ?? hint;
  const describedBy = hasNode(message) ? `${id}__message` : undefined;

  const {
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
  } = useMultiSelectDropdownState({
    disabled,
    maxSelected,
    onChange,
    options,
    searchable,
    value,
  });

  return (
    <div className={classNames('relative grid gap-1.5', className)}>
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
          'w-full',
          'flex items-center gap-2',
          'border border-input bg-background text-foreground',
          'shadow-sm',
          'rounded-xl',
          'px-sm py-2',
          'outline-none transition-colors duration-fast ease-ease-out',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none',
          'cursor-pointer disabled:cursor-not-allowed',
          hasError ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
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
            'text-xs',
            hasError ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
