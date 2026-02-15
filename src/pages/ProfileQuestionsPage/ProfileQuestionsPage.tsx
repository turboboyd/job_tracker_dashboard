import { useTranslation } from "react-i18next";

export default function ProfileQuestionsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {t("profileQuestions.title", "Profile questions")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          "profileQuestions.subtitle",
          "Questions and answers for profile completion.",
        )}
      </div>
    </div>
  );
}
