import React from "react";

import { classNames } from "src/shared/lib";

export type InputSize = "sm" | "md" | "lg";
export type InputRadius = "md" | "lg" | "xl";
export type InputState = "default" | "error";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  state?: InputState;
  inputSize?: InputSize;
  radius?: InputRadius;
};

const sizeMap: Record<InputSize, string> = {
  sm: "h-9 px-sm text-sm",
  md: "h-10 px-sm text-sm",
  lg: "h-11 px-md text-sm",
};

const radiusMap: Record<InputRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      state = "default",
      inputSize = "md",
      radius = "xl",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={classNames(
          "w-full border bg-background text-foreground",
          "placeholder:text-muted-foreground",
          "outline-none",
          "shadow-sm",
          "transition-colors duration-fast ease-ease-out",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled ? "pointer-events-none opacity-50" : "",
          state === "error"
            ? "border-destructive focus-visible:ring-destructive"
            : "border-border",
          sizeMap[inputSize],
          radiusMap[radius],
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
