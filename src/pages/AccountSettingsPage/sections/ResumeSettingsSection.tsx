import { useTranslation } from "react-i18next";

import { ResumeSettingsCard } from "../ui/ResumeSettingsCard";

import { useResumeSettingsController } from "./useResumeSettingsController";

export function ResumeSettingsSection() {
  const { t } = useTranslation();
  const controller = useResumeSettingsController({
    loadErrorFallback: t(
      "accountSettings.resume.loadError",
      "Failed to load resume.",
    ),
    saveErrorFallback: t(
      "accountSettings.resume.saveError",
      "Failed to save resume.",
    ),
  });

  return (
    <ResumeSettingsCard
      resumeText={controller.resumeText}
      onResumeTextChange={controller.onResumeTextChange}
      isFetching={controller.isFetching}
      isSaving={controller.isSaving}
      error={controller.error}
      justSaved={controller.justSaved}
      hasChanges={controller.hasChanges}
      saveDisabled={controller.saveDisabled}
      resetDisabled={controller.resetDisabled}
      onSave={controller.save}
      onReset={controller.reset}
    />
  );
}
