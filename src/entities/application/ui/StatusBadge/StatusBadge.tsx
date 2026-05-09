import React from "react";
import { useTranslation } from "react-i18next";

import { getStatusMeta, getStageColorForStatus, STATUS_COLOR_CLASS, type StatusKey } from "../../model/status";

function clsx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

interface Props {
  status: StatusKey;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation();
  const meta = getStatusMeta(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        STATUS_COLOR_CLASS[getStageColorForStatus(status)],
        className
      )}
    >
      {t(meta.labelKey)}
    </span>
  );
}