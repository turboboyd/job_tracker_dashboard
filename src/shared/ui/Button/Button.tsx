import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { classNames } from "src/shared/lib";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "text-sm font-medium",
    "transition-colors duration-fast ease-ease-out",
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
          "hover:opacity-90",
        ].join(" "),
        secondary: ["bg-muted text-foreground", "hover:opacity-90"].join(" "),
        outline: [
          "border border-border bg-card text-foreground",
          "hover:bg-muted",
        ].join(" "),
        ghost: "text-foreground hover:bg-muted",
        link: "underline-offset-4 hover:underline text-primary",
      },

      size: {
        default: "h-10 px-md",
        sm: "h-9 px-sm",
        lg: "h-11 px-lg",
        icon: "h-10 w-10 p-0",
      },

      shape: {
        md: "rounded-md",
        lg: "rounded-lg",
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
        className:
          "transition-shadow duration-normal ease-ease-out hover:shadow-md",
      },
      {
        variant: "default",
        shadow: "sm",
        className:
          "transition-shadow duration-normal ease-ease-out hover:shadow-md",
      },
      {
        variant: "secondary",
        shadow: "sm",
        className:
          "transition-shadow duration-normal ease-ease-out hover:shadow-md",
      },
    ],

    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "md",
      shadow: "none",
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
