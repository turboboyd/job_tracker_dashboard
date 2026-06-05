import { useTranslation } from "react-i18next";

import { Button, Card, SectionHeader, TextArea } from "src/shared/ui";

interface ResumeSettingsCardProps {
  resumeText: string;
  onResumeTextChange: (next: string) => void;
  isFetching: boolean;
  isSaving: boolean;
  error: string | null;
  justSaved: boolean;
  hasChanges: boolean;
  saveDisabled: boolean;
  resetDisabled: boolean;
  onSave: () => void;
  onReset: () => void;
}

const RESUME_MAX_LENGTH = 20_000;

export function ResumeSettingsCard({
  resumeText,
  onResumeTextChange,
  isFetching,
  isSaving,
  error,
  justSaved,
  hasChanges,
  saveDisabled,
  resetDisabled,
  onSave,
  onReset,
}: ResumeSettingsCardProps) {
  const { t } = useTranslation();

  const footer = (() => {
    if (error) {
      return <span className="text-sm text-destructive">{error}</span>;
    }
    if (justSaved && !hasChanges) {
      return (
        <span className="text-sm text-success-foreground">
          {t("accountSettings.resume.saved", "Resume saved.")}
        </span>
      );
    }
    if (!isFetching && resumeText.length === 0 && !hasChanges) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("accountSettings.resume.empty", "No resume saved yet.")}
        </span>
      );
    }
    return null;
  })();

  return (
    <Card className="p-4">
      <SectionHeader
        title={t("accountSettings.resume.title", "Resume")}
        subtitle={t(
          "accountSettings.resume.subtitle",
          "Stored in your profile and prefilled when analyzing vacancies",
        )}
      />

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-foreground">
            {t("accountSettings.resume.label", "Resume text")}
          </span>
          <TextArea
            value={resumeText}
            onChange={(event) => onResumeTextChange(event.target.value)}
            disabled={isFetching || isSaving}
            maxLength={RESUME_MAX_LENGTH}
            rows={10}
            className="mt-2 min-h-[200px]"
            placeholder={t(
              "accountSettings.resume.placeholder",
              "Paste your resume or CV...",
            )}
          />
        </label>

        <p className="text-xs text-muted-foreground">
          {t(
            "accountSettings.resume.hint",
            "This resume is used automatically when analyzing vacancies. Clear the field and save to remove it.",
          )}
        </p>

        {footer ? <div>{footer}</div> : null}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={onReset}
            disabled={resetDisabled}
          >
            {t("accountSettings.common.reset", "Reset")}
          </Button>

          <Button onClick={onSave} disabled={saveDisabled}>
            {isSaving
              ? t("accountSettings.common.saving", "Saving...")
              : t("accountSettings.common.save", "Save")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
