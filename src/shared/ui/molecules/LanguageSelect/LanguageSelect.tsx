import { useMemo } from "react";

import type { SupportedLng } from "src/shared/config/i18n/i18n";

import { Select, type SelectOption } from "../../Form/Select/Select";

import { LANGUAGES } from "./languages";
import type { LanguageSelectProps } from "./languageSelect.types";

export type {
  LanguageItem,
  LanguageLabelMode,
  LanguageSelectProps,
} from "./languageSelect.types";

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
  const options: SelectOption<SupportedLng>[] = useMemo(
    () =>
      LANGUAGES.map((language) => ({
        value: language.code,
        label: labelMode === "short" ? language.shortLabel : language.fullLabel,
        ...(language.disabled !== undefined ? { disabled: language.disabled } : {}),
      })),
    [labelMode],
  );

  return (
    <Select<SupportedLng>
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      className={className ?? ""}
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
