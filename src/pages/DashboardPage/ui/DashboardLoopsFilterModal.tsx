import React from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";
import { Button, Modal } from "src/shared/ui";

export type DashboardLoopsFilterValue =
  | { mode: "all" }
  | { mode: "selected"; selectedLoopIds: string[] };

export type DashboardLoopOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loops: DashboardLoopOption[];
  value: DashboardLoopsFilterValue;
  onChange: (next: DashboardLoopsFilterValue) => void;
};

function uniq(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export function DashboardLoopsFilterModal({
  open,
  onOpenChange,
  loops,
  value,
  onChange,
}: Props) {
    const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const isAll = value.mode === "all";
  const selected = React.useMemo(() => {
    if (value.mode !== "selected") return [];
    return uniq(value.selectedLoopIds);
  }, [value]);

  const setAll = React.useCallback(() => {
    onChange({ mode: "all" });
  }, [onChange]);

  const setSelectedMode = React.useCallback(() => {
    onChange({ mode: "selected", selectedLoopIds: selected });
  }, [onChange, selected]);

  const toggleLoop = React.useCallback(
    (loopId: string) => {
      const base = new Set(selected);
      if (base.has(loopId)) base.delete(loopId);
      else base.add(loopId);
      onChange({ mode: "selected", selectedLoopIds: Array.from(base) });
    },
    [onChange, selected]
  );

  const selectAll = React.useCallback(() => {
    onChange({ mode: "selected", selectedLoopIds: loops.map((l) => l.id) });
  }, [loops, onChange]);

  const clearAll = React.useCallback(() => {
    onChange({ mode: "selected", selectedLoopIds: [] });
  }, [onChange]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("loopsFilter.title", "Dashboard loops")}
      description={t(
        "loopsFilter.desc",
        "Choose which loops should be included in dashboard stats and recent jobs."
      )}
      size="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="dashboard-loops-filter"
              checked={isAll}
              onChange={setAll}
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
              onChange={setSelectedMode}
            />
            <span className="text-sm text-foreground">
              {t("loopsFilter.selected", "Only selected loops")}
            </span>
          </label>
        </div>

        {!isAll ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                shape="pill"
                onClick={selectAll}
              >
                {t("loopsFilter.selectAll", "Select all")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                shape="pill"
                onClick={clearAll}
              >
                {t("loopsFilter.clear", "Clear")}
              </Button>
              <div className="text-xs text-muted-foreground">
                {t("loopsFilter.selectedCount", "Selected")}: {selected.length}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              {loops.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  {t("loopsFilter.noLoops", "No loops found.")}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {loops.map((l) => {
                    const checked = selected.includes(l.id);
                    return (
                      <li key={l.id} className="p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLoop(l.id)}
                          />
                          <span
                            className={classNames(
                              "text-sm",
                              checked ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {l.name}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button size="sm" shape="pill" onClick={() => onOpenChange(false)}>
            {t("common.done", "Done")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
