import { useTranslation } from "react-i18next";

import { Button, Card } from "src/shared/ui";

import { CvVersionAction, CvVersionSummary } from "./cvBuilder.fields";
import type { CvRow } from "./cvBuilder.helpers";

interface CvVersionsCardProps {
  isLoading: boolean;
  list: CvRow[];
  onRefresh: () => void;
  userId?: string | null;
}

interface CvVersionItemProps {
  row: CvRow;
}

interface CvVersionsListProps {
  isLoading: boolean;
  list: CvRow[];
}

export function CvVersionsCard({ isLoading, list, onRefresh, userId }: CvVersionsCardProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{t("cvBuilder.list.title", "CV Versions")}</div>
        <Button size="sm" variant="outline" disabled={!userId || isLoading} onClick={onRefresh}>
          {t("cvBuilder.list.refresh", "Refresh")}
        </Button>
      </div>

      <CvVersionsList isLoading={isLoading} list={list} />
    </Card>
  );
}

function CvVersionsList({ isLoading, list }: CvVersionsListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("cvBuilder.list.loading", "Loading...")}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("cvBuilder.list.empty", "No CV versions yet.")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {list.map((row) => (
        <CvVersionItem key={row.id} row={row} />
      ))}
    </div>
  );
}

function CvVersionItem({ row }: CvVersionItemProps) {
  const { t } = useTranslation();

  return (
    <div className="py-sm flex items-center gap-md">
      <CvVersionSummary row={row} />
      <CvVersionAction
        downloadUrl={row.downloadUrl}
        emptyLabel="-"
        openLabel={t("cvBuilder.list.open", "Open")}
      />
    </div>
  );
}
