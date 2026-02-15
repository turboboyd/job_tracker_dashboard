import React from "react";

import { classNames } from "src/shared/lib";

import { BaseInput, type BaseInputProps, type InputSize } from "./BaseInput";

function hasSlot(node: React.ReactNode) {
  return node !== null && node !== undefined && node !== false;
}

function sizeToInlinePadding(size: InputSize | null | undefined) {
  switch (size) {
    case "sm":
      return { left: "pl-9", right: "pr-9" };
    case "lg":
      return { left: "pl-11", right: "pr-11" };
    case "md":
    default:
      return { left: "pl-10", right: "pr-10" };
  }
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.3 6.7C4.2 8.5 2.5 12 2.5 12S6.5 18.5 12 18.5c2 0 3.8-.8 5.3-1.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 5.8A8.9 8.9 0 0 1 12 5.5C17.5 5.5 21.5 12 21.5 12s-1.1 1.8-2.8 3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={classNames("animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2a10 10 0 1 0 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getRightActionClass() {
  return "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

function buildRightItems(params: {
  rightSlot?: React.ReactNode;
  withRight: boolean;
  loading?: boolean;
  showClear: boolean;
  disabled?: boolean;
  onClearClick: () => void;
  isPassword: boolean;
  showPasswordToggle?: boolean;
  passwordVisible: boolean;
  onTogglePassword: () => void;
  passwordToggleLabelShow: string;
  passwordToggleLabelHide: string;
}): React.ReactNode[] {
  const {
    rightSlot,
    withRight,
    loading,
    showClear,
    disabled,
    onClearClick,
    isPassword,
    showPasswordToggle,
    passwordVisible,
    onTogglePassword,
    passwordToggleLabelShow,
    passwordToggleLabelHide,
  } = params;

  const items: React.ReactNode[] = [];
  const actionBtnClass = getRightActionClass();

  if (loading) {
    items.push(
      <span
        key="loading"
        className="inline-flex h-8 w-8 items-center justify-center"
      >
        <SpinnerIcon className="h-4 w-4" />
      </span>
    );
  }

  if (showClear) {
    items.push(
      <button
        key="clear"
        type="button"
        className={actionBtnClass}
        onClick={onClearClick}
        aria-label="Clear"
        tabIndex={disabled ? -1 : 0}
      >
        <XIcon className="h-4 w-4" />
      </button>
    );
  }

  if (isPassword && showPasswordToggle && !disabled) {
    items.push(
      <button
        key="password-toggle"
        type="button"
        className={actionBtnClass}
        onClick={onTogglePassword}
        aria-label={
          passwordVisible ? passwordToggleLabelHide : passwordToggleLabelShow
        }
      >
        {passwordVisible ? (
          <EyeOffIcon className="h-4 w-4" />
        ) : (
          <EyeIcon className="h-4 w-4" />
        )}
      </button>
    );
  }

  if (withRight) items.push(<span key="slot">{rightSlot}</span>);

  return items;
}

function getPaddingClasses(args: {
  size: InputSize | null | undefined;
  withLeft: boolean;
  hasRightDecorations: boolean;
}) {
  const { size, withLeft, hasRightDecorations } = args;
  const iconPad = sizeToInlinePadding(size);

  return {
    left: withLeft ? iconPad.left : "",
    right: hasRightDecorations ? iconPad.right : "",
  };
}

export type InputControlProps = BaseInputProps & {
  rootClassName?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
  showPasswordToggle?: boolean;
  passwordToggleLabelShow?: string;
  passwordToggleLabelHide?: string;
};

export const InputControl = React.forwardRef<HTMLInputElement, InputControlProps>(
  (
    {
      rootClassName,
      leftSlot,
      rightSlot,
      clearable,
      onClear,
      loading,
      showPasswordToggle,
      passwordToggleLabelShow = "Show password",
      passwordToggleLabelHide = "Hide password",
      className,
      size,
      type,
      value,
      defaultValue,
      onChange,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const withLeft = hasSlot(leftSlot);
    const withRight = hasSlot(rightSlot);

    const isPassword = type === "password";
    const [passwordVisible, setPasswordVisible] = React.useState(false);

    let effectiveType = type;
    if (isPassword && showPasswordToggle) {
      effectiveType = passwordVisible ? "text" : "password";
    }

    const currentValue = toStringValue(value);
    const currentDefaultValue = toStringValue(defaultValue);
    const isEmpty = (currentValue ?? currentDefaultValue ?? "").length === 0;

    const showClear = Boolean(clearable) && !isEmpty && !disabled && !readOnly;

    const handleClear = React.useCallback(() => {
      onClear?.();
      if (!onClear && onChange) {
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [onChange, onClear]);

    const rightItems = buildRightItems({
      rightSlot,
      withRight,
      loading,
      showClear,
      disabled,
      onClearClick: handleClear,
      isPassword,
      showPasswordToggle,
      passwordVisible,
      onTogglePassword: () => setPasswordVisible((v) => !v),
      passwordToggleLabelShow,
      passwordToggleLabelHide,
    });

    const hasRightDecorations =
      rightItems.length > 0 ||
      Boolean(loading) ||
      Boolean(showClear) ||
      (isPassword && Boolean(showPasswordToggle));

    const padding = getPaddingClasses({
      size,
      withLeft,
      hasRightDecorations,
    });

    const hasDecorations = withLeft || rightItems.length > 0;

    if (!hasDecorations) {
      return (
        <BaseInput
          ref={ref}
          type={effectiveType}
          size={size}
          className={classNames(className)}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
      );
    }

    return (
      <div
        className={classNames(
          "relative",
          props.width === "auto" ? "w-auto" : "w-full",
          rootClassName
        )}
      >
        {withLeft ? (
          <div className="pointer-events-none absolute left-0 top-0 flex h-full items-center pl-sm text-muted-foreground">
            {leftSlot}
          </div>
        ) : null}

        <BaseInput
          ref={ref}
          type={effectiveType}
          size={size}
          className={classNames(padding.left, padding.right, className)}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          width="full"
          {...props}
        />

        {rightItems.length ? (
          <div className="absolute right-0 top-0 flex h-full items-center gap-1 pr-sm">
            {rightItems}
          </div>
        ) : null}
      </div>
    );
  }
);

InputControl.displayName = "InputControl";

export function SearchLeftSlot({ className }: { className?: string }) {
  return <MagnifierIcon className={classNames("h-4 w-4", className)} />;
}
