import React from "react";

import { classNames } from "src/shared/lib";

type CardVariant = "default" | "subtle" | "inset";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardShadow = "none" | "sm" | "md" | "lg";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  shadow?: CardShadow;
  interactive?: boolean;
};

const paddingMap: Record<CardPadding, string> = {
  none: "",
  sm: "p-md",
  md: "p-lg",
  lg: "p-lg sm:p-6",
};

const shadowMap: Record<CardShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const variantMap: Record<CardVariant, string> = {
  default: "bg-card text-card-foreground border border-border",
  subtle:  "bg-background text-foreground border border-border",
  inset:   "bg-muted/60 text-foreground border border-border/60",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "none",
      shadow = "none",
      interactive = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={classNames(
          "rounded-xl",
          variantMap[variant],
          paddingMap[padding],
          shadowMap[shadow],
          interactive &&
            classNames(
              "cursor-pointer",
              "transition-all duration-150 ease-ease-out",
              "motion-safe:hover:-translate-y-0.5",
              "motion-safe:hover:shadow-md",
              "motion-safe:hover:border-ring/40"
            ),
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
