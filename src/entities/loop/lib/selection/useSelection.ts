import { useCallback, useMemo, useState } from "react";

export function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(() => ids.filter((id) => selected[id]), [ids, selected]);
  const allSelected = ids.length > 0 && selectedIds.length === ids.length;
  const anySelected = selectedIds.length > 0;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (ids.length === 0) return prev;
      const next: Record<string, boolean> = {};
      const make = !(ids.every((id) => prev[id]));
      ids.forEach((id) => (next[id] = make));
      return next;
    });
  }, [ids]);

  const clear = useCallback(() => setSelected({}), []);

  return { selectedIds, anySelected, allSelected, toggle, toggleAll, clear };
}
