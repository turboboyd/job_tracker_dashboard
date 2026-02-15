import { useTranslation } from "react-i18next";

export default function CvCheckerPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {t("cvChecker.title", "CV Checker")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          "cvChecker.subtitle",
          "Coming soon. Upload or paste your CV to get structure and clarity feedback.",
        )}
      </div>
    </div>
  );
}
