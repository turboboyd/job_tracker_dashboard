import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export type DashboardTranslate = (key: string, fallback: string) => string;

export function useDashboardTranslate(): DashboardTranslate {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  return useCallback(
    (key: string, fallback: string) => String(t(key, { defaultValue: fallback })),
    [t],
  );
}
