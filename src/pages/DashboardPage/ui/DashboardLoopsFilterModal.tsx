import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Modal } from "src/shared/ui";

import { uniqLoopIds } from "./dashboardLoopsFilter.helpers";
import {
  DashboardLoopsFilterOptions,
  DashboardLoopsSelectionPanel,
} from "./DashboardLoopsFilterModal.sections";
import type {
  DashboardLoopOption,
  DashboardLoopsFilterModalProps,
  DashboardLoopsFilterValue,
} from "./DashboardLoopsFilterModal.types";

export type { DashboardLoopOption, DashboardLoopsFilterValue };

export function DashboardLoopsFilterModal({
  open,
  onOpenChange,
  loops,
  value,
  onChange,
}: DashboardLoopsFilterModalProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const isAll = value.mode === "all";
  const selected = React.useMemo(() => {
    if (value.mode !== "selected") return [];
    return uniqLoopIds(value.selectedLoopIds);
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
    [onChange, selected],
  );

  const selectAll = React.useCallback(() => {
    onChange({ mode: "selected", selectedLoopIds: loops.map((loop) => loop.id) });
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
        "Choose which loops should be included in dashboard stats and recent jobs.",
      )}
      size="md"
    >
      <div className="space-y-4">
        <DashboardLoopsFilterOptions
          isAll={isAll}
          onSetAll={setAll}
          onSetSelected={setSelectedMode}
          t={t}
        />

        {!isAll ? (
          <DashboardLoopsSelectionPanel
            loops={loops}
            onClearAll={clearAll}
            onSelectAll={selectAll}
            onToggleLoop={toggleLoop}
            selected={selected}
            t={t}
          />
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
