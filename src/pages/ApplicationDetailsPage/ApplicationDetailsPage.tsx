import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth";
import {
  type ApplicationDoc,
  type ProcessStatus,
  type HistoryEventDoc,
  getApplication,
  getApplicationHistory,
  changeStatus,
  addComment,
  updateApplicationWithHistory,
} from "src/features/applications/firestoreApplications";
// TODO(backend-migration): Replace with REST API call when migrating from Firebase.
// Currently uses Firestore direct SDK (firebase/firestore).
// Migration target: POST /api/applications/:appId (PATCH semantics)
import { db } from "src/shared/config/firebase/firebase";
import { Button, InlineError } from "src/shared/ui";
import { Input } from "src/shared/ui/Form/Input";

import { InlineField } from "./ui/InlineField";
import { SalaryField } from "./ui/SalaryField";
import { TagsField } from "./ui/TagsField";

import type { WorkMode } from "src/features/applications/firestore/types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function statusLabel(status: ProcessStatus): string {
  switch (status) {
    case "SAVED": return "Saved";
    case "PLANNED": return "Planned";
    case "APPLIED": return "Applied";
    case "VIEWED": return "Viewed";
    case "INTERVIEW_1": return "Interview";
    case "INTERVIEW_2": return "Interview 2";
    case "TEST_TASK": return "Test task";
    case "OFFER": return "Offer";
    case "REJECTED": return "Rejected";
    case "NO_RESPONSE": return "No response";
    default: return status;
  }
}

function formatTs(ts: unknown): string {
  if (!ts) return "";
  try {
    const maybe = ts as { toDate?: unknown };
    const d =
      typeof maybe?.toDate === "function"
        ? (maybe.toDate as () => Date)()
        : new Date(ts as never);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function historyTitle(ev: HistoryEventDoc): string {
  if (ev.type === "STATUS_CHANGE") return `Status: ${ev.fromStatus ?? "?"} → ${ev.toStatus ?? "?"}`;
  if (ev.type === "COMMENT") return "Comment";
  if (ev.type === "FIELD_CHANGE") return `Field: ${ev.fieldPath ?? "?"}`;
  return ev.comment ? ev.comment : "System";
}

// ─────────────────────────────────────────────
// Stage bar
// ─────────────────────────────────────────────

const STAGE_STEPS: { status: ProcessStatus; label: string }[] = [
  { status: "SAVED", label: "Saved" },
  { status: "APPLIED", label: "Applied" },
  { status: "INTERVIEW_1", label: "Interview" },
  { status: "TEST_TASK", label: "Test task" },
  { status: "OFFER", label: "Offer" },
];

const TERMINAL_NEGATIVE: ProcessStatus[] = ["REJECTED", "NO_RESPONSE"];

function StageBar({ current }: { current: ProcessStatus }) {
  const isTerminalNeg = TERMINAL_NEGATIVE.includes(current);
  const currentIdx = STAGE_STEPS.findIndex((s) => s.status === current);

  return (
    <div className="rounded-[14px] border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-0 overflow-x-auto">
        {STAGE_STEPS.map((step, i) => {
          const isActive = step.status === current;
          const isPast = !isTerminalNeg && currentIdx > i;
          const isLast = i === STAGE_STEPS.length - 1;

          return (
            <div key={step.status} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center gap-1 px-1">
                <div
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isPast
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {isPast ? (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6l2.5 2.5 4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={[
                    "text-[10.5px] whitespace-nowrap",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={[
                    "flex-1 h-px mx-1",
                    isPast ? "bg-primary/40" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
        {isTerminalNeg && (
          <>
            <div className="flex-1 h-px mx-1 bg-border" />
            <div className="flex flex-col items-center gap-1 px-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-[10.5px] font-semibold text-destructive">
                ✕
              </div>
              <span className="text-[10.5px] whitespace-nowrap font-semibold text-destructive">
                {current === "REJECTED" ? "Rejected" : "No response"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Work mode chip selector
// ─────────────────────────────────────────────

const WORK_MODE_OPTIONS: { value: WorkMode | "ANY"; label: string }[] = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
  { value: "ANY", label: "Any" },
];

interface WorkModeChipsProps {
  current?: WorkMode;
  onSelect: (mode: WorkMode | undefined) => void;
  disabled?: boolean;
}

function WorkModeChips({ current, onSelect, disabled }: WorkModeChipsProps) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">
          Work mode
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WORK_MODE_OPTIONS.map((opt) => {
          const isActive =
            opt.value === "ANY" ? current == null : current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (opt.value === "ANY") {
                  onSelect(undefined);
                } else {
                  onSelect(opt.value as WorkMode);
                }
              }}
              className={[
                "rounded-[6px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Status buttons config
// ─────────────────────────────────────────────

const STATUS_BUTTONS: ProcessStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW_1",
  "OFFER",
  "REJECTED",
  "NO_RESPONSE",
];

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function ApplicationDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const { userId, isAuthReady } = useAuthSelectors();

  const [app, setApp] = useState<ApplicationDoc | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; data: HistoryEventDoc }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "statuses" | "comments">("all");

  const title = useMemo(() => {
    if (!app) return "";
    return `${app.job.roleTitle} • ${app.job.companyName}`;
  }, [app]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    if (historyFilter === "statuses") return history.filter((h) => h.data.type === "STATUS_CHANGE");
    return history.filter((h) => h.data.type === "COMMENT");
  }, [history, historyFilter]);

  async function load() {
    if (!userId || !appId) return;
    setIsLoading(true);
    setError(null);
    try {
      // TODO(backend-migration): Replace with GET /api/v1/applications/:appId
      const a = await getApplication(db, userId, appId);
      setApp(a);
      // TODO(backend-migration): Replace with GET /api/v1/applications/:appId/history
      const h = await getApplicationHistory(db, userId, appId, 50);
      setHistory(h);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthReady || !userId || !appId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, userId, appId]);

  async function onChangeStatus(next: ProcessStatus) {
    if (!userId || !appId) return;
    setIsMutating(true);
    setError(null);
    try {
      await changeStatus(db, userId, appId, next);
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function onAddComment() {
    if (!userId || !appId) return;
    const text = commentText.trim();
    if (!text) return;
    setIsMutating(true);
    setError(null);
    try {
      await addComment(db, userId, appId, { text });
      setCommentText("");
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  // ─── Inline field save handlers ──────────────────────────────────────────

  // TODO(backend-migration): updateApplicationWithHistory writes directly to Firestore.
  // When migrating: use PATCH /api/v1/applications/:appId with JSON body patch.
  // History events are currently computed client-side; server should handle them.

  async function saveField(
    patch: Record<string, unknown>,
    historyComment?: string,
    fieldPath?: string,
  ): Promise<void> {
    if (!userId || !appId) return;
    await updateApplicationWithHistory(db, userId, appId, patch, () => [
      {
        actor: "user",
        type: "FIELD_CHANGE",
        fieldPath,
        comment: historyComment,
      },
    ]);
    await load();
  }

  async function saveRoleTitle(newValue: string) {
    const prev = app?.job.roleTitle ?? "";
    await saveField(
      { "job.roleTitle": newValue },
      `Role: "${prev}" → "${newValue}"`,
      "job.roleTitle",
    );
  }

  async function saveCompanyName(newValue: string) {
    const prev = app?.job.companyName ?? "";
    await saveField(
      { "job.companyName": newValue },
      `Company: "${prev}" → "${newValue}"`,
      "job.companyName",
    );
  }

  async function saveLocation(newValue: string) {
    await saveField({ "job.locationText": newValue }, undefined, "job.locationText");
  }

  async function saveVacancyUrl(newValue: string) {
    await saveField({ "job.vacancyUrl": newValue }, undefined, "job.vacancyUrl");
  }

  async function saveSource(newValue: string) {
    await saveField({ "job.source": newValue }, undefined, "job.source");
  }

  async function saveSalary(salary: { currency: string; min?: number; max?: number }) {
    await saveField({ "job.salary": salary }, undefined, "job.salary");
  }

  async function saveWorkMode(mode: WorkMode | undefined) {
    if (!userId || !appId) return;
    setIsMutating(true);
    setError(null);
    try {
      await updateApplicationWithHistory(db, userId, appId, { "job.workMode": mode ?? null }, () => [
        { actor: "user", type: "FIELD_CHANGE", fieldPath: "job.workMode" },
      ]);
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsMutating(false);
    }
  }

  async function saveNote(newValue: string) {
    await saveField({ "notes.currentNote": newValue }, undefined, "notes.currentNote");
  }

  async function saveTags(newTags: string[]) {
    await saveField({ "notes.tags": newTags }, undefined, "notes.tags");
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const titleText =
    (t("applicationDetails.titleFallback", {
      defaultValue: "Application",
      returnObjects: false,
    }) ?? "Application") as string;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Sticky header ── */}
      <div className="shrink-0 border-b border-border bg-background px-7 py-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => navigate(RoutePath[AppRoutes.APPLICATIONS])}
              >
                {
                  (t("applicationDetails.applications", {
                    defaultValue: "Applications",
                    returnObjects: false,
                  }) ?? "Applications") as string
                }
              </button>
              <span>/</span>
              <span className="text-muted-foreground">
                {title || titleText}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {app?.job.roleTitle || titleText}
            </h1>

            {/* Subtitle */}
            {app && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {app.job.companyName} · {statusLabel(app.process.status)}
                {app.priority ? ` · Priority: ${app.priority.score}` : ""}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => navigate(RoutePath[AppRoutes.APPLICATIONS])}
            >
              ←{" "}
              {
                (t("applicationDetails.back", {
                  defaultValue: "Back",
                  returnObjects: false,
                }) ?? "Back") as string
              }
            </button>
            {app?.job.vacancyUrl ? (
              <a
                href={app.job.vacancyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {
                  (t("applicationDetails.openVacancy", {
                    defaultValue: "Open vacancy",
                    returnObjects: false,
                  }) ?? "Open vacancy") as string
                }
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>

        {/* Stage bar */}
        {app ? <StageBar current={app.process.status} /> : null}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7 space-y-6">
          {error ? <InlineError message={error} /> : null}

          {isLoading && !app && (
            <div className="text-sm text-muted-foreground">
              {
                (t("applicationDetails.loading", {
                  defaultValue: "Loading…",
                  returnObjects: false,
                }) ?? "Loading…") as string
              }
            </div>
          )}

          {!isLoading && !app && (
            <div className="text-sm text-muted-foreground">
              {
                (t("applicationDetails.notFound", {
                  defaultValue: "Not found",
                  returnObjects: false,
                }) ?? "Not found") as string
              }
            </div>
          )}

          {app && (
            <>
              {/* Two-column grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* ── LEFT COLUMN ── */}
                <div className="space-y-6">
                  {/* Job details card */}
                  <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-3">
                      Job Details
                    </p>

                    <InlineField
                      label="Role title"
                      value={app.job.roleTitle}
                      onSave={saveRoleTitle}
                      disabled={isMutating}
                      placeholder="—"
                    />
                    <InlineField
                      label="Company name"
                      value={app.job.companyName}
                      onSave={saveCompanyName}
                      disabled={isMutating}
                      placeholder="—"
                    />
                    <InlineField
                      label="Location"
                      value={app.job.locationText ?? ""}
                      onSave={saveLocation}
                      disabled={isMutating}
                      placeholder="—"
                    />
                    <InlineField
                      label="Vacancy URL"
                      value={app.job.vacancyUrl ?? ""}
                      onSave={saveVacancyUrl}
                      type="url"
                      disabled={isMutating}
                      placeholder="—"
                    />
                    <InlineField
                      label="Source"
                      value={app.job.source ?? ""}
                      onSave={saveSource}
                      disabled={isMutating}
                      placeholder="—"
                    />

                    <SalaryField
                      salary={app.job.salary}
                      onSave={saveSalary}
                      disabled={isMutating}
                    />

                    <WorkModeChips
                      current={app.job.workMode}
                      onSelect={(mode) => void saveWorkMode(mode)}
                      disabled={isMutating}
                    />
                  </div>

                  {/* Notes card */}
                  <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-3">
                      Notes
                    </p>

                    <InlineField
                      label="Note"
                      value={app.notes?.currentNote ?? ""}
                      onSave={saveNote}
                      multiline
                      disabled={isMutating}
                      placeholder="Add a note…"
                    />

                    <TagsField
                      tags={app.notes?.tags ?? []}
                      onSave={saveTags}
                      disabled={isMutating}
                    />
                  </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-6">
                  {/* Quick actions card */}
                  <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-3">
                      Quick Actions
                    </p>

                    {/* Status buttons */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-2">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_BUTTONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={isMutating}
                            onClick={() => void onChangeStatus(s)}
                            className={[
                              "rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50",
                              app.process.status === s
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-foreground border-border hover:bg-muted",
                            ].join(" ")}
                          >
                            {statusLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add comment */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
                        {
                          (t("applicationDetails.comment", {
                            defaultValue: "Add comment",
                            returnObjects: false,
                          }) ?? "Add comment") as string
                        }
                      </p>
                      <div className="flex gap-2">
                        <Input
                          preset="default"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={
                            (t("applicationDetails.commentPh", {
                              defaultValue: "Write a short note…",
                              returnObjects: false,
                            }) ?? "Write a short note…") as string
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && commentText.trim()) void onAddComment();
                          }}
                        />
                        <Button
                          disabled={!commentText.trim() || isMutating}
                          onClick={() => void onAddComment()}
                        >
                          {
                            (t("applicationDetails.add", {
                              defaultValue: "Add",
                              returnObjects: false,
                            }) ?? "Add") as string
                          }
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Matching card */}
                  <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-3">
                      {
                        (t("applicationDetails.matching", {
                          defaultValue: "Matching",
                          returnObjects: false,
                        }) ?? "Matching") as string
                      }
                    </p>
                    {!app.matching ? (
                      <div className="text-sm text-muted-foreground">
                        {
                          (t("applicationDetails.noMatching", {
                            defaultValue: "No matching data yet. Add description or skills.",
                            returnObjects: false,
                          }) ?? "No matching data yet. Add description or skills.") as string
                        }
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            {
                              (t("applicationDetails.decision", {
                                defaultValue: "Decision",
                                returnObjects: false,
                              }) ?? "Decision") as string
                            }
                            :
                          </span>{" "}
                          <span className="font-medium">{app.matching.decision}</span>{" "}
                          <span className="text-muted-foreground">
                            ({app.matching.score}/100)
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {
                              (t("applicationDetails.matched", {
                                defaultValue: "Matched",
                                returnObjects: false,
                              }) ?? "Matched") as string
                            }
                            :
                          </span>{" "}
                          {app.matching.matchedSkillsTop.length
                            ? app.matching.matchedSkillsTop.join(", ")
                            : "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {
                              (t("applicationDetails.gaps", {
                                defaultValue: "Gaps",
                                returnObjects: false,
                              }) ?? "Gaps") as string
                            }
                            :
                          </span>{" "}
                          {app.matching.gapsTop.length
                            ? app.matching.gapsTop.join(", ")
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            (t("applicationDetails.computedAt", {
                              defaultValue: "Computed",
                              returnObjects: false,
                            }) ?? "Computed") as string
                          }{" "}
                          {formatTs(app.matching.computedAt)} •{" "}
                          {
                            (t("applicationDetails.confidence", {
                              defaultValue: "Confidence",
                              returnObjects: false,
                            }) ?? "Confidence") as string
                          }{" "}
                          {Math.round(app.matching.confidence * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── History timeline (full width) ── */}
              <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
                    {
                      (t("applicationDetails.history", {
                        defaultValue: "History",
                        returnObjects: false,
                      }) ?? "History") as string
                    }
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["all", "All"],
                        ["statuses", "Statuses"],
                        ["comments", "Comments"],
                      ] as const
                    ).map(([key, defaultLabel]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={historyFilter === key ? "default" : "outline"}
                        onClick={() => setHistoryFilter(key)}
                      >
                        {
                          (t(`applicationDetails.historyFilter.${key}`, {
                            defaultValue: defaultLabel,
                            returnObjects: false,
                          }) ?? defaultLabel) as string
                        }
                      </Button>
                    ))}
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {
                      (t("applicationDetails.noHistory", {
                        defaultValue: "No history yet.",
                        returnObjects: false,
                      }) ?? "No history yet.") as string
                    }
                  </div>
                ) : (
                  <div>
                    {filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        className="relative pl-5 py-2 border-b border-border/50 last:border-b-0 before:absolute before:left-0 before:top-3.5 before:h-2 before:w-2 before:rounded-full before:bg-border"
                      >
                        <div className="text-[13px] font-medium text-foreground">
                          {historyTitle(h.data)}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {formatTs(h.data.createdAt)} · {h.data.actor}
                        </div>
                        {h.data.comment ? (
                          <div className="mt-1 text-[13px] text-foreground">
                            {h.data.comment}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
