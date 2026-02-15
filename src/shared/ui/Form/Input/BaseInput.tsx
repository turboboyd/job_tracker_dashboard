import { cva, type VariantProps } from "class-variance-authority";
import React from "react";


import { classNames } from "src/shared/lib";

export type InputSize = "sm" | "md" | "lg";
export type InputRadius = "md" | "lg" | "xl";
export type InputPaddingX = "xs" | "sm" | "md";
export type InputWidth = "full" | "auto";

export type InputIntent = "default" | "error" | "success" | "warning";

export const baseInputVariants = cva(
  [
    "block",
    "bg-input text-foreground",
    "border border-input",
    "hover:border-border",
    "placeholder:text-muted-foreground",
    "outline-none",
    "transition-colors duration-fast ease-ease-out",

    "focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",

    "disabled:pointer-events-none disabled:opacity-50",

    "read-only:cursor-default read-only:bg-muted/30",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-9 text-sm",
        md: "h-10 text-sm",
        lg: "h-11 text-sm",
      },

      radius: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },

      paddingX: {
        xs: "px-xs", 
        sm: "px-sm", 
        md: "px-md", 
      },

      width: {
        full: "w-full",
        auto: "w-auto",
      },

      intent: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success-foreground/40 focus-visible:ring-success-foreground/40",
        warning: "border-warning-foreground/40 focus-visible:ring-warning-foreground/40",
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
      paddingX: "sm",
      width: "full",
      intent: "default",
      shadow: "sm",
    },
  }
);

export interface BaseInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "width">,
    VariantProps<typeof baseInputVariants> {}

export const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      className,
      size,
      radius,
      paddingX,
      width,
      intent,
      shadow,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        data-intent={intent ?? "default"}
        className={classNames(
          baseInputVariants({ size, radius, paddingX, width, intent, shadow }),
          className
        )}
        {...props}
      />
    );
  }
);

BaseInput.displayName = "BaseInput";
