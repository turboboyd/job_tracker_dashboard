import { useTranslation } from "react-i18next";

export function MatchesEmptyState({ kind }: { kind: "loops-loading" | "no-loops" }) {
  const { t } = useTranslation();
  if (kind === "loops-loading") {
    return (
      <div className="rounded-[14px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
        {t("matches.empty.loadingLoops", "Loading loops…")}
      </div>
    );
  }
  return (
    <div className="rounded-[14px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
      {t("matches.empty.noLoops", "Create a search loop to see matches here.")}
    </div>
  );
}
