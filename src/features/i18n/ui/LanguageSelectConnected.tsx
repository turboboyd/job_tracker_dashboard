import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth";
import { useUpdateUserSettingsMutation } from "src/entities/userSettings/api/userSettingsApi";
import type { SupportedLng } from "src/shared/config/i18n/i18n";
import { LANGUAGES } from "src/shared/ui/molecules/LanguageSelect/languages";
import {
  LanguageSelect,
  type LanguageItem,
  type LanguageLabelMode,
} from "src/shared/ui/molecules/LanguageSelect/LanguageSelect";

export type LanguageSelectConnectedProps = {
  labelMode?: LanguageLabelMode;
  value?: SupportedLng;
  onChanged?: (next: SupportedLng) => void;
  persistForAuthedUser?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl";
  width?: "full" | "auto";
  intent?: "default" | "error" | "success" | "warning";
  shadow?: "none" | "sm" | "md";

  placeholder?: React.ReactNode;
};

function normalizeToSupported<L extends string>(
  input: string,
  supported: ReadonlyArray<LanguageItem<L>>,
  fallback: L,
): L {
  const two = input.slice(0, 2).toLowerCase();
  const found = supported.find((x) => x.code === (two as L));
  return found ? found.code : fallback;
}

export function LanguageSelectConnected({
  labelMode = "short",
  value,
  onChanged,
  persistForAuthedUser = true,
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

  const { userId, isAuthenticated, isAuthReady } = useAuthSelectors();
  const canPersist = Boolean(
    persistForAuthedUser && isAuthReady && isAuthenticated && userId,
  );

  const [updateUserSettings] = useUpdateUserSettingsMutation();
  const [isPersisting, setIsPersisting] = useState(false);

  const fallback = (languages[0]?.code ?? "en") as SupportedLng;

  const current = useMemo(() => {
    if (value) return value;
    return normalizeToSupported(i18n.language ?? "en", languages, fallback);
  }, [value, i18n.language, languages, fallback]);

  async function handleChange(next: SupportedLng) {
    await i18n.changeLanguage(next);

    if (canPersist && userId) {
      setIsPersisting(true);
      try {
        await updateUserSettings({
          uid: userId,
          patch: { uiLanguage: next },
        }).unwrap();
      } catch {
        //
      } finally {
        setIsPersisting(false);
      }
    }

    onChanged?.(next);
  }

  const isDisabled = disabled || isPersisting;

  return (
    <LanguageSelect
      labelMode={labelMode}
      value={current}
      onChange={handleChange}
      disabled={isDisabled}
      className={className}
      size={size}
      radius={radius}
      width={width}
      intent={intent}
      shadow={shadow}
      placeholder={placeholder}
    />
  );
}
