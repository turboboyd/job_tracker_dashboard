import { useTranslation } from "react-i18next";

export default function CvBuilderPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {t("cvBuilder.title", "CV Builder")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          "cvBuilder.subtitle",
          "Coming soon. Build a clean CV from your profile and export it.",
        )}
      </div>
    </div>
  );
}
