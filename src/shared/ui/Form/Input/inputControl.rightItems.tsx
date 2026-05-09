import React from "react";

import { classNames } from "src/shared/lib";

import {
  EyeIcon,
  EyeOffIcon,
  SpinnerIcon,
  XIcon,
  inputIconSizeClass,
} from "./inputControl.icons";

const rightActionSizeClass = "inline-flex h-8 w-8 items-center justify-center";
const rightActionButtonClass = classNames(
  rightActionSizeClass,
  "rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

function RightActionButton({
  ariaLabel,
  children,
  onClick,
  tabIndex,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  onClick: () => void;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      className={rightActionButtonClass}
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  );
}

export function buildRightItems(params: {
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

  if (loading) {
    items.push(
      <span key="loading" className={rightActionSizeClass}>
        <SpinnerIcon className={inputIconSizeClass} />
      </span>,
    );
  }

  if (showClear) {
    items.push(
      <RightActionButton
        key="clear"
        onClick={onClearClick}
        ariaLabel="Clear"
        tabIndex={disabled ? -1 : 0}
      >
        <XIcon className={inputIconSizeClass} />
      </RightActionButton>,
    );
  }

  if (isPassword && showPasswordToggle && !disabled) {
    items.push(
      <RightActionButton
        key="password-toggle"
        onClick={onTogglePassword}
        ariaLabel={passwordVisible ? passwordToggleLabelHide : passwordToggleLabelShow}
      >
        {passwordVisible ? (
          <EyeOffIcon className={inputIconSizeClass} />
        ) : (
          <EyeIcon className={inputIconSizeClass} />
        )}
      </RightActionButton>,
    );
  }

  if (withRight) {
    items.push(<span key="slot">{rightSlot}</span>);
  }

  return items;
}

