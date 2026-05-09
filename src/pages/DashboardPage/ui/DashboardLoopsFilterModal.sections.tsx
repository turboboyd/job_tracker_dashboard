import type { TFunction } from "i18next";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui";

import type { DashboardLoopOption } from "./DashboardLoopsFilterModal.types";

interface DashboardLoopsFilterOptionsProps {
  isAll: boolean;
  onSetAll: () => void;
  onSetSelected: () => void;
  t: TFunction<"dashboard">;
}

interface DashboardLoopsSelectionPanelProps {
  loops: DashboardLoopOption[];
  onClearAll: () => void;
  onSelectAll: () => void;
  onToggleLoop: (loopId: string) => void;
  selected: string[];
  t: TFunction<"dashboard">;
}

interface DashboardLoopListProps {
  loops: DashboardLoopOption[];
  onToggleLoop: (loopId: string) => void;
  selected: string[];
  t: TFunction<"dashboard">;
}

export function DashboardLoopsFilterOptions({
  isAll,
  onSetAll,
  onSetSelected,
  t,
}: DashboardLoopsFilterOptionsProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="dashboard-loops-filter"
          checked={isAll}
          onChange={onSetAll}
        />
        <span className="text-sm text-foreground">
          {t("loopsFilter.all", "All loops")}
        </span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="dashboard-loops-filter"
          checked={!isAll}
          onChange={onSetSelected}
        />
        <span className="text-sm text-foreground">
          {t("loopsFilter.selected", "Only selected loops")}
        </span>
      </label>
    </div>
  );
}

export function DashboardLoopsSelectionPanel({
  loops,
  onClearAll,
  onSelectAll,
  onToggleLoop,
  selected,
  t,
}: DashboardLoopsSelectionPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" shape="pill" onClick={onSelectAll}>
          {t("loopsFilter.selectAll", "Select all")}
        </Button>
        <Button size="sm" variant="outline" shape="pill" onClick={onClearAll}>
          {t("loopsFilter.clear", "Clear")}
        </Button>
        <div className="text-xs text-muted-foreground">
          {t("loopsFilter.selectedCount", "Selected")}: {selected.length}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <DashboardLoopList
          loops={loops}
          onToggleLoop={onToggleLoop}
          selected={selected}
          t={t}
        />
      </div>
    </div>
  );
}

function DashboardLoopList({
  loops,
  onToggleLoop,
  selected,
  t,
}: DashboardLoopListProps) {
  if (loops.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("loopsFilter.noLoops", "No loops found.")}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {loops.map((loop) => {
        const checked = selected.includes(loop.id);

        return (
          <li key={loop.id} className="p-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleLoop(loop.id)}
              />
              <span
                className={classNames(
                  "text-sm",
                  checked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {loop.name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
