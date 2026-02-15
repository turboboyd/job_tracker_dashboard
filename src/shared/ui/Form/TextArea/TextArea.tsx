import { cva, type VariantProps } from "class-variance-authority";
import React from "react";


import { classNames } from "src/shared/lib";

export type TextAreaIntent = "default" | "error" | "success" | "warning";
export type TextAreaSize = "sm" | "md" | "lg";
export type TextAreaRadius = "md" | "lg" | "xl";

export type TextAreaStateLegacy = "default" | "error";

const textAreaVariants = cva(
  [
    "block w-full",
    "bg-input text-foreground",
    "border border-input",
    "hover:border-border",
    "placeholder:text-muted-foreground",
    "outline-none",
    "transition-colors duration-fast ease-ease-out",
    "transition-shadow duration-normal ease-ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "read-only:cursor-default read-only:bg-muted/30",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "min-h-[84px] p-3 text-sm",
        md: "min-h-[96px] p-3 text-sm",
        lg: "min-h-[116px] p-4 text-sm",
      },
      radius: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
      intent: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success-foreground/40 focus-visible:ring-success-foreground/40",
        warning: "border-warning-foreground/40 focus-visible:ring-warning-foreground/40",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm hover:shadow-md",        md: "shadow-md hover:shadow-lg",
      },
      resize: {
        none: "resize-none",
        y: "resize-y",
        both: "resize",
      },
    },
    defaultVariants: {
      size: "md",
      radius: "xl",
      intent: "default",
      shadow: "sm",
      resize: "y",
    },
  }
);

export type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> &
  VariantProps<typeof textAreaVariants> & {
    state?: TextAreaStateLegacy;
  };

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { className, state, intent, size, radius, shadow, resize, ...props },
    ref
  ) => {
    const resolvedIntent: TextAreaIntent =
      intent ?? (state === "error" ? "error" : "default");

    return (
      <textarea
        ref={ref}
        data-intent={resolvedIntent}
        className={classNames(
          textAreaVariants({
            size,
            radius,
            intent: resolvedIntent,
            shadow,
            resize,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";
