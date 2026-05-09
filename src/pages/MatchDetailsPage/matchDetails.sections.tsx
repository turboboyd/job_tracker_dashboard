import { PageMessage } from "src/shared/ui/PageHeaders";

import { MatchActionsCard } from "./matchDetails.actions";
import { MatchDescriptionCard } from "./matchDetails.description";
import { MatchMetaCard } from "./matchDetails.meta";
import { MatchOverviewCard } from "./matchDetails.overview";
import type {
  MatchDetailsContentProps,
  MatchDetailsShellProps,
} from "./matchDetails.types";

export { MatchActionsCard } from "./matchDetails.actions";
export { MatchDescriptionCard } from "./matchDetails.description";
export { MatchDetailsHeader } from "./matchDetails.header";
export { MatchMetaCard } from "./matchDetails.meta";
export { MatchOverviewCard } from "./matchDetails.overview";

export function MatchDetailsShell({ children, header }: MatchDetailsShellProps) {
  return (
    <div className="w-full">
      {header}
      {children}
    </div>
  );
}

export function MatchDetailsMessage({ message }: { message: string }) {
  return (
    <div className="pt-lg">
      <PageMessage>{message}</PageMessage>
    </div>
  );
}

export function MatchDetailsContent({
  busy,
  details,
  labels,
  onDelete,
  onEdit,
  onUpdateStatus,
}: MatchDetailsContentProps) {
  return (
    <div className="pt-lg">
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 space-y-lg">
          <MatchOverviewCard
            title={details.title}
            company={details.company}
            meta={details.meta}
            status={details.status}
            openLinkLabel={labels.openLinkLabel}
            url={details.url}
          />

          <MatchDescriptionCard
            title={labels.descriptionTitle}
            description={details.description}
          />
        </div>

        <div className="space-y-lg">
          <MatchActionsCard
            busy={busy}
            currentStatus={details.status}
            actionsTitle={labels.actionsTitle}
            statusLabel={labels.statusLabel}
            editLabel={labels.editLabel}
            deleteLabel={labels.deleteLabel}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />

          <MatchMetaCard
            title={labels.metaTitle}
            loopLabel={labels.loopLabel}
            locationLabel={labels.locationLabel}
            platformLabel={labels.platformLabel}
            matchedAtLabel={labels.matchedAtLabel}
            loopName={details.loopName}
            location={details.location}
            platform={details.platform}
            matchedAt={details.matchedAt}
          />
        </div>
      </div>
    </div>
  );
}
