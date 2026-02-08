import { useTranslation } from "react-i18next";

import type { LoopMatchStatus } from "src/entities/loopMatch";

type Props = {
  value: LoopMatchStatus;
  disabled: boolean;
  label: string;
  onChange: (next: LoopMatchStatus) => void;
};

export function StatusSelect({ value, disabled, label, onChange }: Props) {
  const { t } = useTranslation();

  const options: LoopMatchStatus[] = [
    "new",
    "saved",
    "interview",
    "offer",
    "applied",
    "rejected",
  ];

  return (
    <label className="flex items-center justify-between gap-md text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as LoopMatchStatus)}
        className="h-9 rounded-full px-sm border border-border bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {t(`matches.status.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
