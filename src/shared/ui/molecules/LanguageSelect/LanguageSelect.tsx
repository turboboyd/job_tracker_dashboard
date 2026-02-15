import React, { useMemo } from "react";

import type { SupportedLng } from "src/shared/config/i18n/i18n";
import { Select, type SelectOption } from "src/shared/ui/Form/Select/Select";

import { LANGUAGES } from "./languages";

export type LanguageLabelMode = "short" | "full";

export type LanguageItem<L extends string> = {
  code: L;
  shortLabel: string;
  fullLabel: string;
  disabled?: boolean;
};

export type LanguageSelectProps<L extends string> = {
  labelMode?: LanguageLabelMode;

  /** Текущее значение (controlled) */
  value: L;

  /** onChange для controlled компонента */
  onChange: (next: L) => void;

  disabled?: boolean;
  className?: string;

  size?: "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl";
  width?: "full" | "auto";
  intent?: "default" | "error" | "success" | "warning";
  shadow?: "none" | "sm" | "md";

  placeholder?: React.ReactNode;
};

export function LanguageSelect({
  labelMode = "short",
  value,
  onChange,
  disabled,
  className,
  size,
  radius,
  width,
  intent,
  shadow,
  placeholder,
}: LanguageSelectProps<SupportedLng>) {
  const options: Array<SelectOption<SupportedLng>> = useMemo(
    () =>
      LANGUAGES.map((l) => ({
        value: l.code,
        label: labelMode === "short" ? l.shortLabel : l.fullLabel,
        disabled: l.disabled,
      })),
    [labelMode],
  );

  return (
    <Select<SupportedLng>
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      className={className}
      size={size}
      radius={radius}
      width={width}
      intent={intent}
      shadow={shadow}
      placeholderOption={placeholder}
      aria-label="Select language"
    />
  );
}
