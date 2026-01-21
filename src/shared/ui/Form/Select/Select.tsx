import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { classNames } from "src/shared/lib";

export type SelectIntent = "default" | "error" | "success" | "warning";


export type SelectStateLegacy = "default" | "error";

export type SelectSize = "sm" | "md" | "lg";
export type SelectRadius = "md" | "lg" | "xl";

export type SelectWidth = "full" | "auto";

const selectVariants = cva(
  [
    "block",
    "bg-background text-foreground",
    "border border-input",
    "outline-none",
    "transition-colors duration-fast ease-ease-out",
    "shadow-sm",

    "cursor-pointer",
    "disabled:cursor-not-allowed",

    "focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",

    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-9 text-sm px-sm",
        md: "h-10 text-sm px-sm",
        lg: "h-11 text-sm px-md",
      },
      radius: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
      width: {
        full: "w-full",
        auto: "w-auto",
      },
      intent: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-emerald-500 focus-visible:ring-emerald-500",
        warning: "border-amber-500 focus-visible:ring-amber-500",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
      },
    },
    defaultVariants: {
      size: "md",
      radius: "xl",
      width: "full",
      intent: "default",
      shadow: "sm",
    },
  }
);


export type SelectOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectProps<T extends string> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange" | "size" | "children" | "width"
> &
  VariantProps<typeof selectVariants> & {
    value: T;
    onChange: (next: T) => void;
    options: Array<SelectOption<T>>;
    state?: SelectStateLegacy;
    placeholderOption?: React.ReactNode;
  };

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,

  size,
  radius,
  width,
  intent,
  shadow,

  state,
  placeholderOption,

  disabled,
  ...props
}: SelectProps<T>) {
  const resolvedIntent: SelectIntent =
    intent ?? (state === "error" ? "error" : "default");

  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-invalid={resolvedIntent === "error" ? true : props["aria-invalid"]}
      data-intent={resolvedIntent}
      className={classNames(
        selectVariants({ size, radius, width, intent: resolvedIntent, shadow }),
        className
      )}
      {...props}
    >
      {placeholderOption !== undefined ? (
        <option value="" disabled>
          {placeholderOption}
        </option>
      ) : null}

      {options.map((o) => (
        <option key={String(o.value)} value={o.value} disabled={o.disabled}>
          {typeof o.label === "string" ? o.label : String(o.label)}
        </option>
      ))}
    </select>
  );
}
