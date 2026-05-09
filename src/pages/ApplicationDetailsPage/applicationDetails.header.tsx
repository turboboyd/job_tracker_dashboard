import { StatusLabel } from "src/entities/application";
import type { ApplicationDoc } from "src/features/applications";

import { toStatusKey } from "./applicationDetails.helpers";
import {
  DetailsValueBadge,
} from "./applicationDetails.primitives";
import type { ApplicationDetailsText } from "./applicationDetails.text";

interface ApplicationDetailsHeaderProps {
  app: ApplicationDoc | null;
  onBack: () => void;
  text: ApplicationDetailsText;
  title: string;
}

export function ApplicationDetailsHeader({
  app,
  onBack,
  text,
  title,
}: ApplicationDetailsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-md">
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">
          <button type="button" className="hover:underline" onClick={onBack}>
            {text.back}
          </button>
        </div>
        <div className="truncate text-xl font-semibold text-foreground">
          {title || text.titleFallback}
        </div>
        {app?.job.vacancyUrl ? (
          <div className="break-all text-sm text-muted-foreground">
            <a
              className="hover:underline"
              href={app.job.vacancyUrl}
              target="_blank"
              rel="noreferrer"
            >
              {app.job.vacancyUrl}
            </a>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-sm">
        <DetailsValueBadge>
          {app ? <StatusLabel status={toStatusKey(app.process.status)} /> : text.emptyValue}
        </DetailsValueBadge>
        {app?.priority ? (
          <DetailsValueBadge>
            {text.priority}: {app.priority.score}
          </DetailsValueBadge>
        ) : null}
      </div>
    </div>
  );
}
