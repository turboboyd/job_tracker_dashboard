import React, { useMemo, useRef, useState } from "react";

import { Button } from "src/shared/ui";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  disabled?: boolean;
};

export function AutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 10);
    return suggestions
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 10);
  }, [value, suggestions]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      {label ? (
        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      ) : null}

      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={[
          "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      />

      {open && !disabled && filtered.length > 0 ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-md)]">
          {filtered.map((s) => (
            <Button
              key={s}
              type="button"
              variant="ghost"
              size="default"
              shape="md"
              shadow="none"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
              className={[
                "w-full justify-start rounded-none px-3 py-2",
                "text-left text-sm text-foreground hover:bg-muted transition-colors",
              ].join(" ")}
            >
              {s}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
