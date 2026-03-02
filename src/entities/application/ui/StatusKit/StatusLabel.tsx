import React from "react";
import { useTranslation } from "react-i18next";

import { getStatusMeta, type StatusKey } from "../../model/status";

function humanizeKey(k: string): string {
  return k
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p))
    .join(" ");
}

export interface StatusLabelProps {
  status: StatusKey;
  fallback?: string;
}

export function StatusLabel({ status, fallback }: StatusLabelProps) {
  const { t } = useTranslation();
  const meta = getStatusMeta(status);
  const fb = fallback ?? humanizeKey(meta.key);
  return <>{t(meta.labelKey, { defaultValue: fb })}</>;
}
