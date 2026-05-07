import { useTranslation } from "react-i18next";

export default function InboxPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
          <span>Loopboard</span>
          <span>/</span>
          <span className="text-muted-foreground">{t("inbox.title", "Inbox")}</span>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
          {t("inbox.title", "Inbox")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("inbox.subtitle", "Coming soon. Keep recruiter emails and follow-ups in one place.")}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto bg-background p-7">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-3">📬</div>
            <div className="text-base font-medium text-foreground">
              {t("inbox.emptyTitle", "Nothing here yet")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground max-w-xs">
              {t("inbox.subtitle", "Coming soon. Keep recruiter emails and follow-ups in one place.")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
