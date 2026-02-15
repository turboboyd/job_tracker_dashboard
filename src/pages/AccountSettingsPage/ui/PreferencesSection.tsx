import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { DateFormat } from "src/entities/userSettings/api/userSettingsApi";
import { Button } from "src/shared/ui/Button/Button";
import { Card } from "src/shared/ui/Card/Card";
import { SectionHeader } from "src/shared/ui/PageHeaders/PageHeaders";

import { DateFormatField } from "./DateFormatField";
import { TimeZoneField } from "./TimeZoneField";

export type TimeZoneOption = { value: string; label: string };

type Props = {
  title: string;
  subtitle: string;

  timeZone: string;
  timeZoneOptions: ReadonlyArray<TimeZoneOption>;
  dateFormat: DateFormat;

  onTimeZoneChange: (next: string) => void;
  onDateFormatChange: (next: DateFormat) => void;

  isSaving: boolean;
  error: string | null;

  saveDisabled: boolean;
  resetDisabled: boolean;

  onReset: () => void;
  onSave: () => void;
};

export function PreferencesSection({
  title,
  subtitle,

  timeZone,
  timeZoneOptions,
  dateFormat,

  onTimeZoneChange,
  onDateFormatChange,

  isSaving,
  error,

  saveDisabled,
  resetDisabled,

  onReset,
  onSave,
}: Props) {
  const { t } = useTranslation();

  const hasChanges = useMemo(() => {
    return !(resetDisabled && saveDisabled);
  }, [resetDisabled, saveDisabled]);

  const footerText = useMemo(() => {
    if (error) return error;
    if (!hasChanges) {
      return t("accountSettings.preferences.noChanges", "No changes yet.");
    }
    return "";
  }, [error, hasChanges, t]);

  return (
    <Card className="p-4">
      <SectionHeader title={title} subtitle={subtitle} />

      <div className="mt-4 space-y-4">
        <TimeZoneField
          value={timeZone}
          options={timeZoneOptions}
          onChange={onTimeZoneChange}
        />

        <DateFormatField value={dateFormat} onChange={onDateFormatChange} />

        {footerText ? (
          <div
            className={
              error
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {footerText}
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onReset}
            disabled={resetDisabled || isSaving}
          >
            {t("accountSettings.common.reset", "Reset")}
          </Button>

          <Button onClick={onSave} disabled={saveDisabled || isSaving}>
            {isSaving
              ? t("accountSettings.common.saving", "Saving...")
              : t("accountSettings.common.save", "Save")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
