import React from 'react';

import { classNames } from 'src/shared/lib';

import { BaseInput, type BaseInputProps } from './BaseInput';
import {
  buildRightItems,
  getPaddingClasses,
  hasSlot,
  MagnifierIcon,
  toStringValue,
} from './inputControl.helpers';

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
      passwordToggleLabelShow = 'Show password',
      passwordToggleLabelHide = 'Hide password',
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

    const isPassword = type === 'password';
    const [passwordVisible, setPasswordVisible] = React.useState(false);

    let effectiveType = type;
    if (isPassword && showPasswordToggle) {
      effectiveType = passwordVisible ? 'text' : 'password';
    }

    const currentValue = toStringValue(value);
    const currentDefaultValue = toStringValue(defaultValue);
    const isEmpty = (currentValue ?? currentDefaultValue ?? '').length === 0;

    const showClear = Boolean(clearable) && !isEmpty && !disabled && !readOnly;

    const handleClear = React.useCallback(() => {
      onClear?.();
      if (!onClear && onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [onChange, onClear]);

    const rightItems = buildRightItems({
      rightSlot,
      withRight,
      ...(loading !== undefined ? { loading } : {}),
      showClear,
      ...(disabled !== undefined ? { disabled } : {}),
      onClearClick: handleClear,
      isPassword,
      ...(showPasswordToggle !== undefined ? { showPasswordToggle } : {}),
      passwordVisible,
      onTogglePassword: () => setPasswordVisible((visible) => !visible),
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
          'relative',
          props.width === 'auto' ? 'w-auto' : 'w-full',
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

InputControl.displayName = 'InputControl';

export function SearchLeftSlot({ className }: { className?: string }) {
  return <MagnifierIcon className={classNames('h-4 w-4', className)} />;
}
