import { useTranslation } from "react-i18next";

import { ActionRow } from "src/shared/ui";

import { DashboardIcon } from "../DashboardIcon";

type Props = {
  hasJobs: boolean;
  onGoProfile: () => void;
  onGoQuestions: () => void;
  onGoLoop: () => void;
  onGoJobs: () => void;
  className?: string;
};

export function DashboardOnboardingActions({
  hasJobs,
  onGoProfile,
  onGoQuestions,
  onGoLoop,
  onGoJobs,
  className,
}: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const goText = t("common.go");
  const doneText = t("common.done");

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-3 md:max-w-[520px]">
        <ActionRow
          icon={<DashboardIcon name="user" />}
          title={t("onboarding.setupProfile")}
          onGo={onGoProfile}
          goText={goText}
          doneText={doneText}
        />

        <ActionRow
          icon={<DashboardIcon name="question" />}
          title={t("onboarding.answerQuestions")}
          onGo={onGoQuestions}
          goText={goText}
          doneText={doneText}
        />

        <ActionRow
          icon={<DashboardIcon name="loop" />}
          title={t("onboarding.startFirstLoop")}
          onGo={onGoLoop}
          goText={goText}
          doneText={doneText}
        />

        <ActionRow
          icon={<DashboardIcon name="add" />}
          title={hasJobs ? t("onboarding.addAnotherJob") : t("onboarding.addFirstJob")}
          onGo={onGoJobs}
          goText={goText}
          doneText={doneText}
        />
      </div>
    </div>
  );
}
