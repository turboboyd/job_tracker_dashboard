import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";

import { useOnboardingContext } from "./onboardingContext";

export function RestartOnboardingButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { restart } = useOnboardingContext();

  return (
    <button
      type="button"
      onClick={restart}
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      <RotateCcw className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden="true" />
      {t("onboarding.restart.label", "Restart onboarding")}
    </button>
  );
}
