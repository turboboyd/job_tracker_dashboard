import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { classNames } from "src/shared/lib";

const cardButtonVariants = cva(
  [
    "block w-full text-left",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "transition-colors duration-fast ease-ease-out",
    "select-none",
  ].join(" "),
  {
    variants: {
      effect: {
        none: "",
        scale:
          "transition-transform duration-normal ease-ease-out hover:scale-[1.01] active:scale-[0.99]",
        lift:
          "transition-shadow duration-normal ease-ease-out hover:shadow-md active:shadow-sm",
        scaleLift:
          "transition-all duration-normal ease-ease-out hover:scale-[1.01] active:scale-[0.99] hover:shadow-md active:shadow-sm",
      },
      radius: {
        none: "",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      effect: "scaleLift",
      radius: "xl",
    },
  }
);

export interface CardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cardButtonVariants> {
  asChild?: boolean;
}

export const CardButton = React.forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ className, effect, radius, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type ?? "button"}
        className={classNames(cardButtonVariants({ effect, radius }), className)}
        {...props}
      />
    );
  }
);

CardButton.displayName = "CardButton";
