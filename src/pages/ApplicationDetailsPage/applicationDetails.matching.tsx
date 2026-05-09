import type { ApplicationDoc } from "src/features/applications";
import { Card } from "src/shared/ui/Card";

import { formatTs } from "./applicationDetails.helpers";
import {
  DetailsCardTitle,
  DetailsField,
  DetailsMutedMessage,
  getMatchingListValue,
} from "./applicationDetails.primitives";
import type { ApplicationDetailsText } from "./applicationDetails.text";

interface ApplicationMatchingCardProps {
  app: ApplicationDoc | null;
  text: ApplicationDetailsText;
}

function MatchingEmptyState({ text }: { text: ApplicationDetailsText }) {
  return <DetailsMutedMessage>{text.noMatching}</DetailsMutedMessage>;
}

function MatchingDetails({
  app,
  text,
}: {
  app: ApplicationDoc;
  text: ApplicationDetailsText;
}) {
  if (!app.matching) {
    return <MatchingEmptyState text={text} />;
  }

  return (
    <div className="space-y-2 text-sm">
      <DetailsField
        label={text.decision}
        value={
          <>
            <span className="font-medium">{app.matching.decision}</span>{" "}
            <span className="text-muted-foreground">
              ({app.matching.score}/100)
            </span>
          </>
        }
      />
      <DetailsField
        label={text.matched}
        value={getMatchingListValue(
          app.matching.matchedSkillsTop,
          text.emptyValue,
        )}
      />
      <DetailsField
        label={text.gaps}
        value={getMatchingListValue(app.matching.gapsTop, text.emptyValue)}
      />
      <div className="text-xs text-muted-foreground">
        {text.computedAt} {formatTs(app.matching.computedAt)} |{" "}
        {text.confidence} {Math.round(app.matching.confidence * 100)}%
      </div>
    </div>
  );
}

export function ApplicationMatchingCard({
  app,
  text,
}: ApplicationMatchingCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      <DetailsCardTitle>{text.matching}</DetailsCardTitle>
      {app ? (
        <MatchingDetails app={app} text={text} />
      ) : (
        <MatchingEmptyState text={text} />
      )}
    </Card>
  );
}
