import { useTranslation } from "react-i18next";

export default function InboxPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {t("inbox.title", "Inbox")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t(
          "inbox.subtitle",
          "Coming soon. Keep recruiter emails and follow-ups in one place.",
        )}
      </div>
    </div>
  );
}
