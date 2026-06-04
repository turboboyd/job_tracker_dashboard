import { useTranslation } from "react-i18next";

import type { TimeAgo } from "./loopDetailsView.helpers";

export function useTimeAgoLabel() {
  const { t } = useTranslation();
  return (ago: TimeAgo | null): string => {
    if (!ago) return t("loops.never", "Никогда");
    if (ago.unit === "now") return t("loops.now", "только что");
    if (ago.unit === "minute") return t("loops.minutesAgo", "{{value}} мин назад", { value: ago.value });
    if (ago.unit === "hour") return t("loops.hoursAgo", "{{value}} ч назад", { value: ago.value });
    return t("loops.daysAgo", "{{value}} д назад", { value: ago.value });
  };
}
