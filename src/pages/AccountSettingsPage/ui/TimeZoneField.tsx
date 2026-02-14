import React from "react";
import { useTranslation } from "react-i18next";

import { FormField } from "src/shared/ui/Form/FormField/FormField";
import { Select } from "src/shared/ui/Form/Select/Select";

import type { TimeZoneOption } from "./PreferencesSection";

type Props = {
  value: string;
  options: ReadonlyArray<TimeZoneOption>;
  onChange: (next: string) => void;
};

export function TimeZoneField({ value, options, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <FormField
      label={t("accountSettings.preferences.timeZone", "Time zone")}
      required
    >
      <Select
        value={value as string}
        onChange={(v) => onChange(v)}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
      />
    </FormField>
  );
}
