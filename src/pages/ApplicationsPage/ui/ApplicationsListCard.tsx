import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "src/shared/ui";

import type { AppRow, ViewMode } from "../model/types";

import { ApplicationListItem } from "./ApplicationListItem";
import {
  createApplicationsPageTranslator,
  getApplicationsEmptyStateText,
} from "./applicationsPageUi.helpers";

interface ApplicationsListCardProps {
  list: AppRow[];
  view: ViewMode;
}

export function ApplicationsListCard({
  list,
  view,
}: ApplicationsListCardProps) {
  const { t } = useTranslation();
  const text = createApplicationsPageTranslator(t);
  const emptyText = getApplicationsEmptyStateText(text, view);

  return (
    <Card padding="md" shadow="sm" className="space-y-1">
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium text-foreground">No applications yet</div>
          <div className="text-sm text-muted-foreground max-w-xs">{emptyText}</div>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {list.map((row) => (
            <div key={row.id} className="first:pt-0 last:pb-0">
              <ApplicationListItem row={row} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
