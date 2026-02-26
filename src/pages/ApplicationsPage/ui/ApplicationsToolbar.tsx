import type { PipelineFilterStatus, ViewMode } from "../model/types";

import { PipelineStatusTabs } from "./PipelineStatusTabs";
import { ViewMetaBar } from "./ViewMetaBar";

export function ApplicationsToolbar(props: {
  view: ViewMode;
  activeStatus: PipelineFilterStatus;
  onChangeStatus: (s: PipelineFilterStatus) => void;
  isLoading: boolean;
  count: number;
}) {
  const { view, activeStatus, onChangeStatus, isLoading, count } = props;

  if (view === "pipeline") {
    return (
      <PipelineStatusTabs
        activeStatus={activeStatus}
        onChange={onChangeStatus}
        isLoading={isLoading}
        count={count}
      />
    );
  }

  return <ViewMetaBar view={view} isLoading={isLoading} count={count} />;
}