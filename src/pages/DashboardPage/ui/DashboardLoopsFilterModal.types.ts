export type DashboardLoopsFilterValue =
  | { mode: "all" }
  | { mode: "selected"; selectedLoopIds: string[] };

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
