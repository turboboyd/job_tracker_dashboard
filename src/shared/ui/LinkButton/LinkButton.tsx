import { Link, type LinkProps } from "react-router-dom";

import { classNames } from "src/shared/lib";

export type LinkButtonVariant = "default" | "outline" | "ghost" | "text";
export type LinkButtonSize = "sm" | "md" | "lg";
export type LinkButtonShape = "rounded" | "pill";
export type LinkButtonShadow = "none" | "sm" | "md";

type Props = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];

  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  shape?: LinkButtonShape;
  shadow?: LinkButtonShadow;

  disabled?: boolean;
  className?: string;

  ariaLabel?: string;
};

export function LinkButton({
  variant = "outline",
  size = "lg",
  shape = "pill",
  shadow = "none",
  disabled,
  className,
  ariaLabel,
  ...props
}: Props) {
 const base = classNames(
  "inline-flex items-center justify-center gap-2",
  "whitespace-nowrap select-none",
  "font-medium text-sm",
  "transition-colors duration-fast ease-ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

const shapes: Record<LinkButtonShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-md",
};

const sizes: Record<LinkButtonSize, string> = {
  sm: "h-9 px-sm text-sm",
  md: "h-10 px-md text-sm",
  lg: "h-11 px-lg text-sm",
};

const variants: Record<LinkButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  text: "bg-transparent text-foreground px-0 h-auto hover:underline",
};

const shadows: Record<LinkButtonShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
};


  const disabledStyles = disabled ? "pointer-events-none opacity-50" : "";

  return (
    <Link
      {...props}
      aria-label={ariaLabel}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : props.tabIndex}
      className={classNames(
        base,
        shapes[shape],
        sizes[size],
        variants[variant],
        shadows[shadow],
        disabledStyles,
        className
      )}
    />
  );
}
