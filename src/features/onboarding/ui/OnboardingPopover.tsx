import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import type { OnboardingButtons } from "../model/onboardingNav";
import { ONBOARDING_STEPS } from "../model/onboardingSteps";

import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingStepContent } from "./OnboardingStepContent";

interface OnboardingPopoverProps {
  stepIndex: number;
  total: number;
  buttons: OnboardingButtons;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  titleId: string;
}

/**
 * The floating explanation card (progress + step content + actions). Positioning
 * is owned by the overlay; this component is layout-agnostic.
 */
export function OnboardingPopover({
  stepIndex,
  total,
  buttons,
  onSkip,
  onBack,
  onNext,
  onFinish,
  titleId,
}: OnboardingPopoverProps) {
  const { t } = useTranslation();
  const step = ONBOARDING_STEPS[stepIndex];
  if (!step) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="w-[320px] max-w-[calc(100vw-24px)] rounded-[14px] border border-border bg-card p-4 shadow-xl"
    >
      <div className="flex flex-col gap-4">
        <OnboardingStepContent step={step} titleId={titleId} />
        <OnboardingProgress current={stepIndex} total={total} />
        <div className="flex items-center justify-between gap-3">
          {buttons.showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("onboarding.tour.back", "Back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("onboarding.tour.skip", "Skip")}
            </button>
          )}
          <Button onClick={buttons.isLast ? onFinish : onNext}>
            {buttons.isLast
              ? t("onboarding.tour.finish", "Start using Loopboard")
              : t("onboarding.tour.next", "Next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
