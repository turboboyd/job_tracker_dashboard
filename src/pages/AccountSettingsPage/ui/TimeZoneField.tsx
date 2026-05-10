import React from "react";
import { useTranslation } from "react-i18next";

import { FormField, Select } from "src/shared/ui";

import type { TimeZoneOption } from "./preferences.types";

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
