import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Modal } from "src/shared/ui";

import {
  ALL_PLATFORMS,
  GROUPS,
  PLATFORM_LABEL_BY_ID,
  RECOMMENDED_PLATFORMS,
  platformsByGroup,
  type LoopPlatform,
} from "../../model";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  value: LoopPlatform[];
  disabled?: boolean;

  onSave: (next: LoopPlatform[]) => Promise<void> | void;
};

function uniquePlatforms(list: LoopPlatform[]) {
  const set = new Set<LoopPlatform>();
  for (const p of list) set.add(p);
  return Array.from(set);
}

function sortByLabel(list: LoopPlatform[]) {
  return [...list].sort((a, b) => {
    const la = PLATFORM_LABEL_BY_ID[a] ?? a;
    const lb = PLATFORM_LABEL_BY_ID[b] ?? b;
    return la.localeCompare(lb);
  });
}

export function EditSourcesModal({
  open,
  onOpenChange,
  value,
  disabled,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LoopPlatform[]>(() =>
    uniquePlatforms(value ?? [])
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(uniquePlatforms(value ?? []));
  }, [open, value]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const totalSelected = selected.length;

  const toggle = (p: LoopPlatform) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return Array.from(next);
    });
  };

  const setPresetRecommended = () => setSelected(RECOMMENDED_PLATFORMS);
  const setPresetAll = () => setSelected(ALL_PLATFORMS);

  const toggleGroup = (groupId: (typeof GROUPS)[number]["id"]) => {
    const groupPlatforms = platformsByGroup(groupId);
    setSelected((prev) => {
      const next = new Set(prev);
      const allInGroupSelected = groupPlatforms.every((p) => next.has(p));
      if (allInGroupSelected) {
        for (const p of groupPlatforms) next.delete(p);
      } else {
        for (const p of groupPlatforms) next.add(p);
      }
      return Array.from(next);
    });
  };

  const canSave = !disabled && !isSaving;

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(uniquePlatforms(selected));
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("loops.editSources", "Edit sources")}
      description={t(
        "loops.editSourcesDescription",
        "Choose job boards/platforms. This controls which search links are generated."
      )}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {t("loops.selected", "Selected")}: {" "}
            <span className="font-medium text-foreground">{totalSelected}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              shape="lg"
              onClick={setPresetRecommended}
              disabled={disabled || isSaving}
            >
              {t("loops.recommended", "Recommended")}
            </Button>
            <Button
              variant="outline"
              shape="lg"
              onClick={setPresetAll}
              disabled={disabled || isSaving}
            >
              {t("loops.selectAll", "Select all")}
            </Button>
          </div>
        </div>

        {/* Groups */}
        <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {t("loops.groups", "Groups")}
          </div>

          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => {
              const groupPlatforms = platformsByGroup(g.id);
              const countSelected = groupPlatforms.filter((p) =>
                selectedSet.has(p)
              ).length;
              const isAll =
                countSelected === groupPlatforms.length &&
                groupPlatforms.length > 0;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  disabled={disabled || isSaving}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                    isAll
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground",
                    disabled || isSaving
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/40",
                  ].join(" ")}
                >
                  <span className="font-medium">{g.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {countSelected}/{groupPlatforms.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* All Platforms */}
        <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {t("loops.platforms", "Platforms")}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {sortByLabel(ALL_PLATFORMS).map((p) => {
              const checked = selectedSet.has(p);
              const label = PLATFORM_LABEL_BY_ID[p] ?? p;

              return (
                <label
                  key={p}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card",
                    disabled || isSaving
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p)}
                    disabled={disabled || isSaving}
                  />
                  <span className="text-foreground">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            shadow="sm"
            shape="lg"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isSaving ? t("loops.saving", "Saving...") : t("loops.save", "Save")}
          </Button>
          <Button
            variant="outline"
            shape="lg"
            onClick={() => onOpenChange(false)}
            disabled={disabled || isSaving}
          >
            {t("loops.cancel", "Cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
