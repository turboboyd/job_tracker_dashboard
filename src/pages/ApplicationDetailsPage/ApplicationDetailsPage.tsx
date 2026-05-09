import { CalendarRange, History as HistoryIcon, LayoutDashboard, Users } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApplicationContactsCard } from "src/features/contacts";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";
import { Input } from "src/shared/ui/Form/Input";
import { InlineError } from "src/shared/ui/InlineError";

import { ApplicationDetailsHero } from "./applicationDetails.hero";
import { DetailsCardTitle } from "./applicationDetails.primitives";
import {
  ApplicationHistoryCard,
  ApplicationMatchingCard,
  ApplicationPlanCard,
  ApplicationSummaryCard,
} from "./applicationDetails.sections";
import { DetailsTabs, type TabDescriptor } from "./applicationDetails.tabs";
import { createApplicationDetailsText } from "./applicationDetails.text";
import { useApplicationDetailsController } from "./useApplicationDetailsController";

type DetailsTabKey = "overview" | "plan" | "contacts" | "history";

export default function ApplicationDetailsPage() {
  const { t } = useTranslation();
  const text = useMemo(() => createApplicationDetailsText(t), [t]);
  const {
    addApplicationComment,
    app,
    appId,
    applyReminderOutcome,
    buildEmptyRow,
    changeApplicationStatus,
    commentText,
    completeReminder,
    contactOptions,
    error,
    filteredHistory,
    goBack,
    historyFilter,
    historyHasMore,
    historyTotalCount,
    isLoading,
    isMutating,
    reminderRows,
    removeReminderRow,
    setCommentText,
    setHistoryFilter,
    snoozeReminder,
    snoozeReminderTo,
    title,
    upsertReminder,
  } = useApplicationDetailsController();

  const [activeTab, setActiveTab] = useState<DetailsTabKey>("overview");
  const planSectionRef = useRef<HTMLDivElement | null>(null);

  const goToPlan = () => {
    setActiveTab("plan");
    window.setTimeout(() => {
      planSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const tabs: TabDescriptor<DetailsTabKey>[] = [
    { key: "overview", label: text.tabOverview, icon: LayoutDashboard },
    { key: "plan", label: text.tabPlan, icon: CalendarRange },
    { key: "contacts", label: text.tabContacts, icon: Users },
    {
      key: "history",
      label: text.tabHistory,
      icon: HistoryIcon,
      count: historyTotalCount,
      countSuffix: historyHasMore ? "+" : undefined,
    },
  ];

  let contactsTabContent = null;
  if (activeTab === "contacts") {
    contactsTabContent = appId ? (
      <ApplicationContactsCard
        appId={appId}
        appDisplayTitle={title}
        appCompanyName={app?.job.companyName}
      />
    ) : (
      <Card padding="md" shadow="sm">
        <div className="text-sm text-muted-foreground">{text.notFound}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-lg">
      <ApplicationDetailsHero
        app={app}
        isMutating={isMutating}
        onBack={goBack}
        onChangeStatus={changeApplicationStatus}
        onEditNextAction={goToPlan}
        text={text}
        title={title}
      />

      {error ? <InlineError message={error} /> : null}

      <DetailsTabs active={activeTab} onChange={setActiveTab} tabs={tabs}>
        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            <ApplicationSummaryCard app={app} isLoading={isLoading} text={text} />
            <ApplicationMatchingCard app={app} text={text} />
          </div>
        ) : null}

        {activeTab === "plan" ? (
          <div ref={planSectionRef} className="grid grid-cols-1 gap-md xl:grid-cols-2">
            <ApplicationPlanCard
              app={app}
              appId={appId}
              isMutating={isMutating}
              reminders={reminderRows}
              contactOptions={contactOptions}
              onUpsertReminder={upsertReminder}
              onRemoveReminder={removeReminderRow}
              onCompleteReminder={completeReminder}
              onSnoozeReminder={snoozeReminder}
              onSnoozeReminderTo={snoozeReminderTo}
              onApplyOutcome={(rowId, payload) =>
                applyReminderOutcome({
                  sourceRowId: rowId,
                  outcome: payload.outcome,
                  commentOverride: payload.commentOverride,
                  followUpAt: payload.followUpAt,
                  contactLabel: payload.contactLabel,
                  text,
                })
              }
              buildEmptyRow={buildEmptyRow}
              text={text}
            />

            <Card padding="md" shadow="sm" className="space-y-sm">
              <DetailsCardTitle>{text.comment}</DetailsCardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  preset="default"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder={text.commentPlaceholder}
                />
                <Button
                  shape="pill"
                  disabled={!commentText.trim() || isMutating}
                  onClick={addApplicationComment}
                >
                  {text.add}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {contactsTabContent}

        {activeTab === "history" ? (
          <ApplicationHistoryCard
            history={filteredHistory}
            historyFilter={historyFilter}
            onHistoryFilterChange={setHistoryFilter}
            text={text}
          />
        ) : null}
      </DetailsTabs>
    </div>
  );
}
