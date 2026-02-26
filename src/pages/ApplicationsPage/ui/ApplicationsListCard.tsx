import { useTranslation } from "react-i18next";

import { Card } from "src/shared/ui";

import type { ViewMode } from "../model/types";
import type { AppRow } from "../model/useApplicationsPage";

import { ApplicationListItem } from "./ApplicationListItem";


export function ApplicationsListCard(props: { list: AppRow[]; view: ViewMode }) {
  const { t } = useTranslation();
  const { list, view } = props;

  let emptyText: string;
  if (view === "today") {
    emptyText =
      (t("applicationsPage.empty.today", {
        defaultValue: "Nothing for today.",
        returnObjects: false,
      }) ?? "Nothing for today.") as string;
  } else if (view === "followups") {
    emptyText =
      (t("applicationsPage.empty.followups", {
        defaultValue: "No follow-ups due.",
        returnObjects: false,
      }) ?? "No follow-ups due.") as string;
  } else {
    emptyText =
      (t("applicationsPage.empty.pipeline", {
        defaultValue: "No applications yet.",
        returnObjects: false,
      }) ?? "No applications yet.") as string;
  }

  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {list.map((row) => (
            <div key={row.id} className="py-[2px]">
              <ApplicationListItem row={row} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
