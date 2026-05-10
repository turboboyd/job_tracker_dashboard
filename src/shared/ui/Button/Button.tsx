import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { classNames } from "src/shared/lib/classNames";

const SHADOW_TRANSITION = "transition-shadow duration-normal ease-ease-out";
const HOVER_SHADOW = "hover:shadow-md";
const ACTIVE_SHADOW = "active:shadow-sm";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "text-sm font-medium",
    "transition-colors duration-fast ease-ease-out",
    SHADOW_TRANSITION,
    "active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border border-transparent",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          HOVER_SHADOW,
          ACTIVE_SHADOW,
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground border border-border",
          "hover:bg-secondary/80",
          HOVER_SHADOW,
          ACTIVE_SHADOW,
        ].join(" "),
        outline: [
          "border border-border bg-card text-foreground",
          "hover:bg-muted/60",
          HOVER_SHADOW,
          ACTIVE_SHADOW,
        ].join(" "),
        ghost: "text-foreground hover:bg-muted/70 active:bg-muted",
        link: "underline-offset-4 hover:underline text-primary",
      },

      size: {
        default: "h-9 px-md text-sm",
        sm: "h-8 px-sm text-xs",
        lg: "h-10 px-lg text-sm",
        icon: "h-9 w-9 p-0",
      },

      shape: {
        md: "rounded-lg",
        lg: "rounded-xl",
        pill: "rounded-full",
      },

      shadow: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
      },
    },

    compoundVariants: [
      {
        variant: "outline",
        shadow: "sm",
        className: `${SHADOW_TRANSITION} ${HOVER_SHADOW}`,
      },
      {
        variant: "default",
        shadow: "sm",
        className: `${SHADOW_TRANSITION} ${HOVER_SHADOW}`,
      },
      {
        variant: "secondary",
        shadow: "sm",
        className: `${SHADOW_TRANSITION} ${HOVER_SHADOW}`,
      },
    ],

    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "md",
      shadow: "sm",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      shadow,
      asChild = false,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type ?? "button"}
        className={classNames(
          buttonVariants({ variant, size, shape, shadow }),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
