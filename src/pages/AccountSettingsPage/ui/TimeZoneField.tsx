import React from "react";
import { useTranslation } from "react-i18next";

import { FormField } from "src/shared/ui/Form/FormField/FormField";
import { Select } from "src/shared/ui/Form/Select/Select";

import type { TimeZoneOption } from "./PreferencesSection";

interface Props {
  value: string;
  options: readonly TimeZoneOption[];
  onChange: (next: string) => void;
}

export function TimeZoneField({ value, options, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <FormField
      label={t("accountSettings.preferences.timeZone", "Time zone")}
      required
    >
      <Select
        value={value}
        onChange={(v) => onChange(v)}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
      />
    </FormField>
  );
}
