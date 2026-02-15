import { useTranslation } from "react-i18next";

export default function QuestionsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {t("questions.title", "Questions")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          "questions.subtitle",
          "Coming soon. We’ll help you refine your profile and job-search strategy with a short Q&A flow.",
        )}
      </div>
    </div>
  );
}
