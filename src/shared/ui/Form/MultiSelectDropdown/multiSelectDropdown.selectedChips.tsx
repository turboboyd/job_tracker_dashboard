import type { MultiSelectOption } from "./multiSelectDropdown.helpers";

interface SelectedChipsProps<T extends string> {
  onRemove: (value: T) => void;
  placeholder: string;
  selectedOptions: MultiSelectOption<T>[];
}

export function SelectedChips<T extends string>({
  selectedOptions,
  placeholder,
  onRemove,
}: SelectedChipsProps<T>) {
  if (selectedOptions.length === 0) {
    return <span className="text-sm text-muted-foreground">{placeholder}</span>;
  }

  return (
    <>
      {selectedOptions.map((option) => (
        <span
          key={String(option.value)}
          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
        >
          <span className="max-w-[160px] truncate">{option.label}</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove(option.value);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove"
          >
            ×
          </button>
        </span>
      ))}
    </>
  );
}
