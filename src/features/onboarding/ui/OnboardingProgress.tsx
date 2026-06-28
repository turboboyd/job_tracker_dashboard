import { useTranslation } from "react-i18next";

export function OnboardingProgress({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={[
              "h-1.5 rounded-full transition-all",
              i === current ? "w-5 bg-primary" : "w-1.5 bg-muted",
            ].join(" ")}
          />
        ))}
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {t("onboarding.tour.progress", "Step {{current}} of {{total}}", {
          current: current + 1,
          total,
        })}
      </span>
    </div>
  );
}
