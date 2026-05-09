import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  ALL_STATUSES,
  type StatusKey,
  type Stage,
  statusesForStage,
} from "../../model/status";

interface Props {
  value: StatusKey;
  onChange: (v: StatusKey) => void;
  disabled?: boolean;

  /** Если передать stage — покажем только статусы этого этапа */
  filterStage?: Stage;

  /** Показывать все статусы (по умолчанию да) */
  showAllIfNoStage?: boolean;
}

export function StatusSelect({
  value,
  onChange,
  disabled,
  filterStage,
  showAllIfNoStage = true,
}: Props) {
  const { t } = useTranslation();

  const options = useMemo(() => {
    if (filterStage) return statusesForStage(filterStage);
    return showAllIfNoStage ? ALL_STATUSES : [];
  }, [filterStage, showAllIfNoStage]);

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatusKey)}
      className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground"
    >
      {options.map((s) => (
        <option key={s.key} value={s.key}>
          {t(s.labelKey, s.key.split("_").join(" "))}
        </option>
      ))}
    </select>
  );
}