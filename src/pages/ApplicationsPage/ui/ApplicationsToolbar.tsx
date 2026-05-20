import type { PipelineFilterStatus, ViewMode } from "../model/types";

import { PipelineStatusTabs } from "./PipelineStatusTabs";
import { ViewMetaBar } from "./ViewMetaBar";

export function ApplicationsToolbar(props: {
  view: ViewMode;
  activeStatus: PipelineFilterStatus;
  onChangeStatus: (s: PipelineFilterStatus) => void;
  isLoading: boolean;
  statusCounts: Record<string, number>;
  viewCount: number;
}) {
  const { view, activeStatus, onChangeStatus, isLoading, statusCounts, viewCount } = props;

  if (view === "pipeline") {
    return (
      <PipelineStatusTabs
        activeStatus={activeStatus}
        onChange={onChangeStatus}
        isLoading={isLoading}
        statusCounts={statusCounts}
      />
    );
  }

  return <ViewMetaBar view={view} isLoading={isLoading} count={viewCount} />;
}
