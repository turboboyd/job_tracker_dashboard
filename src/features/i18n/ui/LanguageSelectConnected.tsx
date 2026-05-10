import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SupportedLng } from "src/shared/config/i18n";
import {
  LANGUAGES,
  LanguageSelect,
  type LanguageItem,
  type LanguageLabelMode,
} from "src/shared/ui/molecules/LanguageSelect";

export interface LanguageSelectConnectedProps {
  labelMode?: LanguageLabelMode;
  value?: SupportedLng | undefined;
  onChanged?: (next: SupportedLng) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl";
  width?: "full" | "auto";
  intent?: "default" | "error" | "success" | "warning";
  shadow?: "none" | "sm" | "md";
  placeholder?: React.ReactNode;
}

function normalizeToSupported<L extends string>(
  input: string,
  supported: readonly LanguageItem<L>[],
  fallback: L
): L {
  const two = input.slice(0, 2).toLowerCase();
  const found = supported.find((item) => item.code === (two as L));
  return found ? found.code : fallback;
}

export function LanguageSelectConnected({
  labelMode = "short",
  value,
  onChanged,
  disabled,
  className,
  size,
  radius,
  width,
  intent,
  shadow,
  placeholder,
}: LanguageSelectConnectedProps) {
  const languages = LANGUAGES;
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const fallback = languages[0]?.code ?? "en";

  const current = useMemo(() => {
    if (value) return value;
    return normalizeToSupported(i18n.language ?? "en", languages, fallback);
  }, [fallback, i18n.language, languages, value]);

  async function handleChange(next: SupportedLng) {
    setIsChanging(true);
    try {
      await i18n.changeLanguage(next);
      await onChanged?.(next);
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <LanguageSelect
      labelMode={labelMode}
      value={current}
      onChange={handleChange}
      disabled={(disabled ?? false) || isChanging}
      {...(className ? { className } : {})}
      {...(size ? { size } : {})}
      {...(radius ? { radius } : {})}
      {...(width ? { width } : {})}
      {...(intent ? { intent } : {})}
      {...(shadow ? { shadow } : {})}
      placeholder={placeholder}
    />
  );
}
