import { StatusLabel } from "src/entities/application";
import type { ApplicationDoc } from "src/features/applications";
import { Card } from "src/shared/ui/Card";

import { formatTs, toStatusKey } from "./applicationDetails.helpers";
import {
  DetailsCardTitle,
  DetailsField,
  DetailsMutedMessage,
  formatOptionalTimestamp,
  getBooleanLabel,
} from "./applicationDetails.primitives";
import type { ApplicationDetailsText } from "./applicationDetails.text";

interface ApplicationSummaryCardProps {
  app: ApplicationDoc | null;
  isLoading: boolean;
  text: ApplicationDetailsText;
}

function SummaryContent({
  app,
  text,
}: {
  app: ApplicationDoc;
  text: ApplicationDetailsText;
}) {
  const followUpValue = `${getBooleanLabel(
    app.process.needsFollowUp,
    text,
  )}${formatOptionalTimestamp(app.process.followUpDueAt)}`;
  const reapplyValue = `${getBooleanLabel(
    app.process.needsReapplySuggestion,
    text,
  )}${formatOptionalTimestamp(app.process.reapplyEligibleAt)}`;
  const nextActionAt = formatTs(app.process.nextActionAt);
  const nextActionValue = nextActionAt
    ? [nextActionAt, app.process.nextActionText].filter(Boolean).join(" - ")
    : text.nextActionEmpty;

  return (
    <div className="space-y-2 text-sm">
      <DetailsField label={text.company} value={app.job.companyName} />
      <DetailsField label={text.role} value={app.job.roleTitle} />
      <DetailsField
        label={text.source}
        value={app.job.source ?? text.emptyValue}
      />
      <DetailsField
        label={text.status}
        value={<StatusLabel status={toStatusKey(app.process.status)} />}
      />
      <DetailsField label={text.followUp} value={followUpValue} />
      <DetailsField label={text.nextAction} value={nextActionValue} />
      <DetailsField label={text.reapply} value={reapplyValue} />
    </div>
  );
}

function SummaryBody({ app, isLoading, text }: ApplicationSummaryCardProps) {
  if (isLoading) {
    return <DetailsMutedMessage>{text.loading}</DetailsMutedMessage>;
  }

  if (!app) {
    return <DetailsMutedMessage>{text.notFound}</DetailsMutedMessage>;
  }

  return <SummaryContent app={app} text={text} />;
}

export function ApplicationSummaryCard({
  app,
  isLoading,
  text,
}: ApplicationSummaryCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      <DetailsCardTitle>{text.summary}</DetailsCardTitle>
      <SummaryBody app={app} isLoading={isLoading} text={text} />
    </Card>
  );
}
