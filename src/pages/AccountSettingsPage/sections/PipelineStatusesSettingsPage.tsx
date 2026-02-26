/* eslint-disable sonarjs/no-nested-functions */

import { useEffect, useMemo, useState } from "react";

import { useAuthSelectors } from "src/entities/auth";
import {
  DEFAULT_USER_SETTINGS,
  type PipelineConfig,
  type PipelineStage,
  type PipelineSubStatus,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "src/entities/userSettings/api/userSettingsApi";
import { selectRtkqErrorMessage } from "src/shared/api/selectRtkqErrorMessage";
import { Button, Card, InlineError } from "src/shared/ui";
import { Input } from "src/shared/ui/Form/Input";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

function uidLike(): string {
  // Browser-safe uuid-ish.
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();

  // Fallback: 16 random bytes -> hex
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `id_${hex}`;
}

function clonePipeline(p: PipelineConfig): PipelineConfig {
  return {
    version: p.version,
    defaultStageId: p.defaultStageId,
    stages: p.stages.map((s) => ({
      ...s,
      subStatuses: s.subStatuses.map((x) => ({ ...x })),
    })),
  };
}

function sortByOrder<T extends { order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.order - b.order);
}

function resequence<T extends { order: number }>(arr: T[], step: number = 10): T[] {
  return arr.map((x, i) => ({ ...x, order: (i + 1) * step }));
}

function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const j = index + dir;
  if (j < 0 || j >= next.length) return next;
  const tmp = next[index];
  next[index] = next[j];
  next[j] = tmp;
  return next;
}

export default function PipelineStatusesSettingsPage() {
  const { userId } = useAuthSelectors();
  const uid = userId ?? "";

  const { data, isFetching } = useGetUserSettingsQuery({ uid }, { skip: !uid });
  const [updateSettings, updateState] = useUpdateUserSettingsMutation();

  const savedPipeline = data?.pipeline ?? DEFAULT_USER_SETTINGS.pipeline!;
  const [draft, setDraft] = useState<PipelineConfig>(() => clonePipeline(savedPipeline));

  // When settings load/refresh, reset draft (simple behavior, avoids complex dirty checks).
  useEffect(() => {
    setDraft(clonePipeline(savedPipeline));
  }, [savedPipeline]);

  const error = selectRtkqErrorMessage(updateState.error);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(savedPipeline) !== JSON.stringify(draft);
    } catch {
      return true;
    }
  }, [savedPipeline, draft]);

  const canSave = !!uid && !isFetching && !updateState.isLoading && isDirty;

  const setStage = (stageId: string, patch: Partial<PipelineStage>) => {
    setDraft((prev) => {
      const stages = prev.stages.map((s) =>
        s.id === stageId ? { ...s, ...patch } : s,
      );
      return { ...prev, stages };
    });
  };

  const setSub = (stageId: string, subId: string, patch: Partial<PipelineSubStatus>) => {
    setDraft((prev) => {
      const stages = prev.stages.map((s) => {
        if (s.id !== stageId) return s;
        const subStatuses = s.subStatuses.map((x) =>
          x.id === subId ? { ...x, ...patch } : x,
        );
        return { ...s, subStatuses };
      });
      return { ...prev, stages };
    });
  };

  const addStage = () => {
    const id = `stage_${uidLike()}`;
    setDraft((prev) => {
      const nextStages = resequence(
        sortByOrder([
          ...prev.stages,
          {
            id,
            label: "New stage",
            order: (prev.stages.length + 1) * 10,
            visible: true,
            defaultSubStatusId: undefined,
            subStatuses: [
              {
                id: `sub_${uidLike()}`,
                label: "New status",
                order: 10,
                visible: true,
              },
            ],
          },
        ]),
      );

      const defaultStageId = prev.defaultStageId || nextStages[0]?.id || id;
      return { ...prev, stages: nextStages, defaultStageId };
    });
  };

  const deleteStage = (stageId: string) => {
    setDraft((prev) => {
      const stages = prev.stages.filter((s) => s.id !== stageId);
      const nextStages = resequence(sortByOrder(stages));
      const defaultStageId =
        prev.defaultStageId === stageId
          ? nextStages[0]?.id ?? DEFAULT_USER_SETTINGS.pipeline!.defaultStageId
          : prev.defaultStageId;
      return { ...prev, stages: nextStages, defaultStageId };
    });
  };

  const moveStage = (stageId: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const sorted = sortByOrder(prev.stages);
      const idx = sorted.findIndex((s) => s.id === stageId);
      if (idx === -1) return prev;
      const moved = moveItem(sorted, idx, dir);
      const nextStages = resequence(moved);
      return { ...prev, stages: nextStages };
    });
  };

  const addSubStatus = (stageId: string) => {
    setDraft((prev) => {
      const stages = prev.stages.map((s) => {
        if (s.id !== stageId) return s;
        const id = `sub_${uidLike()}`;
        const next = resequence(
          sortByOrder([
            ...s.subStatuses,
            { id, label: "New status", order: (s.subStatuses.length + 1) * 10, visible: true },
          ]),
        );
        const defaultSubStatusId = s.defaultSubStatusId || next[0]?.id;
        return { ...s, subStatuses: next, defaultSubStatusId };
      });
      return { ...prev, stages };
    });
  };

  const deleteSubStatus = (stageId: string, subId: string) => {
    setDraft((prev) => {
      const stages = prev.stages.map((s) => {
        if (s.id !== stageId) return s;
        const subStatuses = s.subStatuses.filter((x) => x.id !== subId);
        const nextSub = resequence(sortByOrder(subStatuses));
        const defaultSubStatusId =
          s.defaultSubStatusId === subId ? nextSub[0]?.id : s.defaultSubStatusId;
        return { ...s, subStatuses: nextSub, defaultSubStatusId };
      });
      return { ...prev, stages };
    });
  };

  const moveSubStatus = (stageId: string, subId: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const stages = prev.stages.map((s) => {
        if (s.id !== stageId) return s;
        const sorted = sortByOrder(s.subStatuses);
        const idx = sorted.findIndex((x) => x.id === subId);
        if (idx === -1) return s;
        const moved = moveItem(sorted, idx, dir);
        return { ...s, subStatuses: resequence(moved) };
      });
      return { ...prev, stages };
    });
  };

  const onSave = async () => {
    if (!uid) return;
    await updateSettings({
      uid,
      patch: {
        pipeline: draft,
      },
    }).unwrap();
  };

  const onReset = () => setDraft(clonePipeline(savedPipeline));
  const onResetToDefaults = () => setDraft(clonePipeline(DEFAULT_USER_SETTINGS.pipeline!));

  const stagesSorted = useMemo(() => sortByOrder(draft.stages), [draft.stages]);

  return (
    <AccountSettingsLayout
      title="Account settings"
      subtitle="Pipeline/Statuses"
      content={
        <div className="space-y-md">
          {error ? <InlineError message={error} /> : null}

          <Card padding="md" shadow="sm" className="space-y-3">
            <div className="flex items-start justify-between gap-md">
              <div>
                <div className="text-base font-medium">Pipeline/Statuses</div>
                <div className="text-sm text-muted-foreground">
                  Configure pipeline stages and sub-statuses (naming, ordering, visibility, defaults).
                </div>
              </div>
              <div className="flex gap-sm">
                <Button variant="outline" size="sm" onClick={onResetToDefaults} disabled={isFetching || updateState.isLoading}>
                  Reset to defaults
                </Button>
                <Button variant="outline" size="sm" onClick={onReset} disabled={!isDirty || isFetching || updateState.isLoading}>
                  Reset
                </Button>
                <Button size="sm" onClick={onSave} disabled={!canSave}>
                  Save
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-sm">
              <div className="text-sm text-muted-foreground">Default stage:</div>
              <select
                className="h-9 rounded-xl border border-input bg-input px-sm text-sm text-foreground shadow-sm"
                value={draft.defaultStageId}
                onChange={(e) => setDraft((p) => ({ ...p, defaultStageId: e.target.value }))}
              >
                {stagesSorted.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>

              <Button size="sm" variant="outline" onClick={addStage} disabled={isFetching || updateState.isLoading}>
                + Add stage
              </Button>
            </div>
          </Card>

          <div className="space-y-md">
            {stagesSorted.map((stage, idx) => {
              const subSorted = sortByOrder(stage.subStatuses);
              const defaultSub = stage.defaultSubStatusId && subSorted.some((x) => x.id === stage.defaultSubStatusId)
                ? stage.defaultSubStatusId
                : subSorted[0]?.id;

              return (
                <Card key={stage.id} padding="md" shadow="sm" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <div className="flex flex-wrap items-center gap-sm">
                      <Input
                        preset="default"
                        value={stage.label}
                        onChange={(e) => setStage(stage.id, { label: e.target.value })}
                        className="max-w-[320px]"
                        placeholder="Stage label"
                      />

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={stage.visible}
                          onChange={(e) => setStage(stage.id, { visible: e.target.checked })}
                        />
                        Visible
                      </label>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Default sub-status:
                        <select
                          className="h-9 rounded-xl border border-input bg-input px-sm text-sm text-foreground shadow-sm"
                          value={defaultSub ?? ""}
                          onChange={(e) => setStage(stage.id, { defaultSubStatusId: e.target.value })}
                        >
                          {subSorted.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-sm">
                      <Button size="sm" variant="outline" onClick={() => moveStage(stage.id, -1)} disabled={idx === 0 || updateState.isLoading}>
                        ↑
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveStage(stage.id, 1)} disabled={idx === stagesSorted.length - 1 || updateState.isLoading}>
                        ↓
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addSubStatus(stage.id)} disabled={updateState.isLoading}>
                        + Add sub-status
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteStage(stage.id)} disabled={stagesSorted.length <= 1 || updateState.isLoading}>
                        Delete stage
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {subSorted.map((sub, sIdx) => (
                      <div key={sub.id} className="flex flex-wrap items-center gap-sm rounded-xl border border-border bg-background p-sm">
                        <Input
                          preset="default"
                          value={sub.label}
                          onChange={(e) => setSub(stage.id, sub.id, { label: e.target.value })}
                          className="max-w-[320px]"
                          placeholder="Sub-status label"
                        />

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={sub.visible}
                            onChange={(e) => setSub(stage.id, sub.id, { visible: e.target.checked })}
                          />
                          Visible
                        </label>

                        <div className="ml-auto flex flex-wrap items-center gap-sm">
                          <Button size="sm" variant="outline" onClick={() => moveSubStatus(stage.id, sub.id, -1)} disabled={sIdx === 0 || updateState.isLoading}>
                            ↑
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => moveSubStatus(stage.id, sub.id, 1)} disabled={sIdx === subSorted.length - 1 || updateState.isLoading}>
                            ↓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStage(stage.id, { defaultSubStatusId: sub.id })}
                            disabled={updateState.isLoading}
                          >
                            Set default
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSubStatus(stage.id, sub.id)}
                            disabled={subSorted.length <= 1 || updateState.isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card padding="md" shadow="sm" className="space-y-2">
            <div className="text-sm font-medium">Notes</div>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Order is used for sorting in lists/boards. Buttons ↑/↓ adjust it automatically.</li>
              <li>Visibility only hides stages/statuses in UI; existing cards keep their values.</li>
              <li>Defaults are used when you change a stage and need an initial sub-status.</li>
            </ul>
          </Card>
        </div>
      }
    />
  );
}