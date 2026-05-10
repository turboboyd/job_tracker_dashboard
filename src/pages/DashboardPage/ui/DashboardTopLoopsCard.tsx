import type {
  DashboardTopLoop,
  DashboardTopLoopMatch,
} from "./DashboardTopLoopsCard.helpers";
import { DashboardTopLoopsCardLayout } from "./DashboardTopLoopsCard.sections";
import { useDashboardTopLoopsCardController } from "./useDashboardTopLoopsCardController";

interface DashboardTopLoopsCardProps {
  loops: DashboardTopLoop[];
  matches: DashboardTopLoopMatch[];
}

export function DashboardTopLoopsCard({ loops, matches }: DashboardTopLoopsCardProps) {
  const topLoops = useDashboardTopLoopsCardController({ loops, matches });

  return <DashboardTopLoopsCardLayout topLoops={topLoops} />;
}
