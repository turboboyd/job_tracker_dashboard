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
} from "src/features/applications/firestoreApplications";
import { db } from "src/shared/config/firebase/firebase";
import { Button, Card, InlineError } from "src/shared/ui";
import { Input } from "src/shared/ui/Form/Input";



function statusLabel(status: ProcessStatus): string {
  switch (status) {
    case "SAVED":
      return "SAVED";
    case "PLANNED":
      return "PLANNED";
    case "APPLIED":
      return "APPLIED";
    case "VIEWED":
      return "VIEWED";
    case "INTERVIEW_1":
      return "INTERVIEW";
    case "INTERVIEW_2":
      return "INTERVIEW 2";
    case "TEST_TASK":
      return "TEST TASK";
    case "OFFER":
      return "OFFER";
    case "REJECTED":
      return "REJECTED";
    case "NO_RESPONSE":
      return "NO RESPONSE";
    default:
      return status;
  }
}

const STATUS_BUTTONS: ProcessStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW_1",
  "OFFER",
  "REJECTED",
  "NO_RESPONSE",
];

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
  if (ev.type === "STATUS_CHANGE") return `Status: ${ev.fromStatus} → ${ev.toStatus}`;
  if (ev.type === "COMMENT") return `Comment`;
  if (ev.type === "FIELD_CHANGE") return `Field: ${ev.fieldPath}`;
  return ev.comment ? ev.comment : "System";
}

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

  const summaryNode = useMemo(() => {
    if (isLoading) {

  return (
        <div className="text-sm text-muted-foreground">
          {(t("applicationDetails.loading", { defaultValue: "Loading…", returnObjects: false }) ?? "Loading…") as string}
        </div>
      );
    }

    if (!app) {
      return (
        <div className="text-sm text-muted-foreground">
          {(t("applicationDetails.notFound", { defaultValue: "Not found", returnObjects: false }) ?? "Not found") as string}
        </div>
      );
    }

    const followUpYesNo = app.process.needsFollowUp
      ? (t("applicationDetails.yes", { defaultValue: "Yes", returnObjects: false }) ?? "Yes") as string
      : (t("applicationDetails.no", { defaultValue: "No", returnObjects: false }) ?? "No") as string;
    const followUpDue = app.process.followUpDueAt
      ? `(${formatTs(app.process.followUpDueAt)})`
      : "";

    const reapplyYesNo = app.process.needsReapplySuggestion
      ? (t("applicationDetails.yes", { defaultValue: "Yes", returnObjects: false }) ?? "Yes") as string
      : (t("applicationDetails.no", { defaultValue: "No", returnObjects: false }) ?? "No") as string;
    const reapplyAt = app.process.reapplyEligibleAt
      ? `(${formatTs(app.process.reapplyEligibleAt)})`
      : "";

    return (
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">
            {(t("applicationDetails.company", { defaultValue: "Company", returnObjects: false }) ?? "Company") as string}:
          </span>{" "}
          {app.job.companyName}
        </div>
        <div>
          <span className="text-muted-foreground">{(t("applicationDetails.role", { defaultValue: "Role", returnObjects: false }) ?? "Role") as string}:</span>{" "}
          {app.job.roleTitle}
        </div>
        <div>
          <span className="text-muted-foreground">
            {(t("applicationDetails.source", { defaultValue: "Source", returnObjects: false }) ?? "Source") as string}:
          </span>{" "}
          {app.job.source || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">
            {(t("applicationDetails.status", { defaultValue: "Status", returnObjects: false }) ?? "Status") as string}:
          </span>{" "}
          {statusLabel(app.process.status)}
        </div>
        <div>
          <span className="text-muted-foreground">
            {(t("applicationDetails.followup", { defaultValue: "Follow-up", returnObjects: false }) ?? "Follow-up") as string}:
          </span>{" "}
          {followUpYesNo} {followUpDue}
        </div>
        <div>
          <span className="text-muted-foreground">
            {(t("applicationDetails.reapply", { defaultValue: "Re-apply", returnObjects: false }) ?? "Re-apply") as string}:
          </span>{" "}
          {reapplyYesNo} {reapplyAt}
        </div>
      </div>
    );
  }, [app, isLoading, t]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    if (historyFilter === "statuses") {
      return history.filter((h) => h.data.type === "STATUS_CHANGE");
    }
    // comments
    return history.filter((h) => h.data.type === "COMMENT");
  }, [history, historyFilter]);

  async function load() {
    if (!userId || !appId) return;
    setIsLoading(true);
    setError(null);
    try {
      const a = await getApplication(db, userId, appId);
      setApp(a);
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

  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <div className="text-sm text-muted-foreground">
            <button
              type="button"
              className="hover:underline"
              onClick={() => navigate(RoutePath[AppRoutes.APPLICATIONS])}
            >
              {(t("applicationDetails.back", { defaultValue: "← Back to applications", returnObjects: false }) ?? "← Back to applications") as string}
            </button>
          </div>
          <div className="text-xl font-semibold text-foreground">
            {title || (t("applicationDetails.titleFallback", { defaultValue: "Application", returnObjects: false }) ?? "Application") as string}
          </div>
          {app?.job.vacancyUrl ? (
            <div className="text-sm text-muted-foreground break-all">
              <a className="hover:underline" href={app.job.vacancyUrl} target="_blank" rel="noreferrer">
                {app.job.vacancyUrl}
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-sm">
          <div className="rounded-full border border-border bg-muted px-3 py-1 text-[12px] font-medium text-foreground">
            {app ? statusLabel(app.process.status) : "—"}
          </div>
          {app?.priority ? (
            <div className="rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-foreground">
              {(t("applicationDetails.priority", { defaultValue: "Priority", returnObjects: false }) ?? "Priority") as string}: {app.priority.score}
            </div>
          ) : null}
        </div>
      </div>

      {error ? <InlineError message={error} /> : null}

      <Card padding="md" shadow="sm" className="space-y-md">
        <div className="text-base font-semibold">{(t("applicationDetails.actions", { defaultValue: "Actions", returnObjects: false }) ?? "Actions") as string}</div>
        <div className="flex flex-wrap gap-sm">
          {STATUS_BUTTONS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={app?.process.status === s ? "default" : "outline"}
              disabled={!app || isMutating}
              onClick={() => onChangeStatus(s)}
            >
              {statusLabel(s)}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">{(t("applicationDetails.comment", { defaultValue: "Add comment", returnObjects: false }) ?? "Add comment") as string}</div>
          <div className="flex gap-sm">
            <Input
              preset="default"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={(t("applicationDetails.commentPh", { defaultValue: "Write a short note…", returnObjects: false }) ?? "Write a short note…") as string}
            />
            <Button disabled={!commentText.trim() || isMutating} onClick={onAddComment}>
              {(t("applicationDetails.add", { defaultValue: "Add", returnObjects: false }) ?? "Add") as string}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card padding="md" shadow="sm" className="space-y-sm">
          <div className="text-base font-semibold">{(t("applicationDetails.summary", { defaultValue: "Summary", returnObjects: false }) ?? "Summary") as string}</div>
          {summaryNode}
        </Card>

        <Card padding="md" shadow="sm" className="space-y-sm">
          <div className="text-base font-semibold">{(t("applicationDetails.matching", { defaultValue: "Matching", returnObjects: false }) ?? "Matching") as string}</div>
          {!app?.matching ? (
            <div className="text-sm text-muted-foreground">{(t("applicationDetails.noMatching", { defaultValue: "No matching data yet. Add description or skills.", returnObjects: false }) ?? "No matching data yet. Add description or skills.") as string}</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">{(t("applicationDetails.decision", { defaultValue: "Decision", returnObjects: false }) ?? "Decision") as string}:</span>{" "}
                <span className="font-medium">{app.matching.decision}</span>{" "}
                <span className="text-muted-foreground">({app.matching.score}/100)</span>
              </div>
              <div>
                <span className="text-muted-foreground">{(t("applicationDetails.matched", { defaultValue: "Matched", returnObjects: false }) ?? "Matched") as string}:</span>{" "}
                {app.matching.matchedSkillsTop.length ? app.matching.matchedSkillsTop.join(", ") : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">{(t("applicationDetails.gaps", { defaultValue: "Gaps", returnObjects: false }) ?? "Gaps") as string}:</span>{" "}
                {app.matching.gapsTop.length ? app.matching.gapsTop.join(", ") : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {(t("applicationDetails.computedAt", { defaultValue: "Computed", returnObjects: false }) ?? "Computed") as string} {formatTs(app.matching.computedAt)} • {(t("applicationDetails.confidence", { defaultValue: "Confidence", returnObjects: false }) ?? "Confidence") as string} {Math.round(app.matching.confidence * 100)}%
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card padding="md" shadow="sm" className="space-y-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-semibold">
          {((t("applicationDetails.history", { defaultValue: "History", returnObjects: false }) ?? "History") as string)}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={historyFilter === "all" ? "default" : "outline"}
            onClick={() => setHistoryFilter("all")}
          >
            {((t("applicationDetails.historyFilter.all", { defaultValue: "All", returnObjects: false }) ?? "All") as string)}
          </Button>
          <Button
            size="sm"
            variant={historyFilter === "statuses" ? "default" : "outline"}
            onClick={() => setHistoryFilter("statuses")}
          >
            {((t("applicationDetails.historyFilter.statuses", { defaultValue: "Statuses", returnObjects: false }) ?? "Statuses") as string)}
          </Button>
          <Button
            size="sm"
            variant={historyFilter === "comments" ? "default" : "outline"}
            onClick={() => setHistoryFilter("comments")}
          >
            {((t("applicationDetails.historyFilter.comments", { defaultValue: "Comments", returnObjects: false }) ?? "Comments") as string)}
          </Button>
        </div>
      </div>
        {filteredHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground">{(t("applicationDetails.noHistory", { defaultValue: "No history yet.", returnObjects: false }) ?? "No history yet.") as string}</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((h) => (
              <div key={h.id} className="py-sm">
                <div className="text-sm font-medium text-foreground">{historyTitle(h.data)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTs(h.data.createdAt)} • {h.data.actor}
                </div>
                {h.data.comment ? (
                  <div className="mt-1 text-sm text-foreground">{h.data.comment}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
