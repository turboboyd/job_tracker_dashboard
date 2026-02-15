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
    // layout
    "block w-full",
    "appearance-none",
    "cursor-pointer",
    "disabled:cursor-not-allowed",
    "disabled:pointer-events-none disabled:opacity-50",

    // colors (your tokens)
    "bg-input text-foreground",
    "border border-input",

    // typography / spacing baseline
    "leading-normal",

    // focus
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",

    // “adult” feel: smooth shadow + subtle lift on hover
    "shadow-sm",
    "transition-colors transition-shadow duration-normal ease-ease-out",
    "hover:shadow-md",
    "active:shadow-sm",

    // subtle border/brightness changes on hover
    "hover:border-border",
    "bg-clip-padding",
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
        success: "border-success-foreground focus-visible:ring-success-foreground",
        warning: "border-warning-foreground focus-visible:ring-warning-foreground",
      },
      shadow: {
        none: "shadow-none hover:shadow-none",
        sm: "shadow-sm hover:shadow-md",
        md: "shadow-md hover:shadow-lg",
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
    options: ReadonlyArray<SelectOption<T>>;
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
          {typeof placeholderOption === "string"
            ? placeholderOption
            : String(placeholderOption)}
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
