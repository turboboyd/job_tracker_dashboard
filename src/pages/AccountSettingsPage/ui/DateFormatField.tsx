import React from "react";
import { useTranslation } from "react-i18next";

import type { DateFormat } from "src/entities/userSettings/api/userSettingsApi";
import { FormField } from "src/shared/ui/Form/FormField/FormField";

type Props = {
  value: DateFormat;
  onChange: (next: DateFormat) => void;
};

type Option = {
  value: DateFormat;
  title: string;
  subtitle: string;
};

function OptionCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg border px-sm py-3 text-left",
        "transition duration-normal ease-ease-out",
        "hover:shadow-md hover:border-border",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-card-foreground border-border shadow-sm",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div
        className={
          active ? "text-xs opacity-90" : "text-xs text-muted-foreground"
        }
      >
        {subtitle}
      </div>
    </button>
  );
}

export function DateFormatField({ value, onChange }: Props) {
  const { t } = useTranslation();

  const options: Option[] = [
    {
      value: "DD.MM.YYYY" as DateFormat,
      title: "DD.MM.YYYY",
      subtitle: t(
        "accountSettings.preferences.dateFormatExample1",
        "29.01.2026"
      ),
    },
    {
      value: "MM/DD/YYYY" as DateFormat,
      title: "MM/DD/YYYY",
      subtitle: t(
        "accountSettings.preferences.dateFormatExample2",
        "01/29/2026"
      ),
    },
    {
      value: "YYYY-MM-DD" as DateFormat,
      title: "YYYY-MM-DD",
      subtitle: t(
        "accountSettings.preferences.dateFormatExample3",
        "2026-01-29"
      ),
    },
  ];

  return (
    <FormField
      label={t("accountSettings.preferences.dateFormat", "Date format")}
      required
      hint={t("accountSettings.preferences.preview", "Preview") + ": 08.02.2026"}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <OptionCard
            key={o.value}
            active={value === o.value}
            title={o.title}
            subtitle={o.subtitle}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </FormField>
  );
}
