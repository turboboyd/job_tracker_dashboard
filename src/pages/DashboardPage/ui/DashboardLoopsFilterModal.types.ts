// DashboardLoopsFilterValue moved to the dashboard feature layer; re-exported
// here so existing ui consumers (and ui/index.ts) keep their import paths.
import type { DashboardLoopsFilterValue } from "src/features/dashboard";

export type { DashboardLoopsFilterValue };

export interface DashboardLoopOption {
  id: string;
  name: string;
}

export interface DashboardLoopsFilterModalProps {
  loops: DashboardLoopOption[];
  onChange: (next: DashboardLoopsFilterValue) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  value: DashboardLoopsFilterValue;
}
