import { useTranslation } from "react-i18next";

import type { OnboardingStepConfig } from "../model/onboardingSteps";

import { OnboardingStepIcon } from "./OnboardingStepIcon";

export function OnboardingStepContent({
  step,
  titleId,
}: {
  step: OnboardingStepConfig;
  titleId?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
          <OnboardingStepIcon id={step.id} className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={titleId} className="text-[17px] font-semibold leading-tight text-foreground">
            {t(step.titleKey)}
          </h2>
          {step.comingSoon ? (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {t("onboarding.tour.comingSoon", "Coming soon")}
            </span>
          ) : null}
        </div>
      </div>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">{t(step.bodyKey)}</p>
    </div>
  );
}
