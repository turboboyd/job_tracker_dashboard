import { useCallback, useState } from "react";

import {
  getCustomRangeDraft,
  normalizeCustomRange,
  parseDateInput,
} from "./trends.helpers";
import type { CustomRange, RangeKey } from "./trends.types";

interface DashboardTrendsCustomRangeParams {
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
  onRangeChange: (range: RangeKey) => void;
}

interface DashboardTrendsCustomRangeState {
  customOpen: boolean;
  draftFrom: string;
  draftTo: string;
  onApplyCustom: () => void;
  onCustomOpenChange: (open: boolean) => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onOpenCustom: () => void;
}

export function useDashboardTrendsCustomRange({
  customRange,
  onCustomRangeChange,
  onRangeChange,
}: DashboardTrendsCustomRangeParams): DashboardTrendsCustomRangeState {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(() => getCustomRangeDraft(customRange));

  const openCustom = useCallback(() => {
    setDraftRange(getCustomRangeDraft(customRange));
    setCustomOpen(true);
  }, [customRange]);

  const setDraftFrom = useCallback((value: string) => {
    setDraftRange((current) => ({ ...current, from: value }));
  }, []);

  const setDraftTo = useCallback((value: string) => {
    setDraftRange((current) => ({ ...current, to: value }));
  }, []);

  const applyCustom = useCallback(() => {
    const from = parseDateInput(draftRange.from);
    const to = parseDateInput(draftRange.to);

    if (!from || !to) return;

    onCustomRangeChange(normalizeCustomRange(from, to));
    onRangeChange("custom");
    setCustomOpen(false);
  }, [draftRange.from, draftRange.to, onCustomRangeChange, onRangeChange]);

  return {
    customOpen,
    draftFrom: draftRange.from,
    draftTo: draftRange.to,
    onApplyCustom: applyCustom,
    onCustomOpenChange: setCustomOpen,
    onDraftFromChange: setDraftFrom,
    onDraftToChange: setDraftTo,
    onOpenCustom: openCustom,
  };
}
