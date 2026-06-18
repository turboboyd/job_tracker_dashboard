import { Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getContactFullName } from "src/entities/contact";
import {
  type ApplicationDoc,
  type ProcessStatus,
  setReminders,
} from "src/features/applications";
import type { ApplicationDocument } from "src/features/applications/rest/adapter";
import {
  changeApplicationStatusViaRest,
  createApplicationCommentViaRest,
  deleteDocumentViaRest,
  downloadDocumentViaRest,
  getApplicationByIdViaRest,
  getApplicationHistoryViaRest,
  listApplicationDocumentsViaRest,
  uploadApplicationDocumentViaRest,
  validateApplicationDocumentUploadFile,
  type DocumentKind,
} from "src/features/applications/rest/queries";
import { useAuthSelectors } from "src/features/auth/model";
import { getContactsByApplication } from "src/features/contacts";
import { ApiError } from "src/shared/api/rest/restClient";
import { db } from "src/shared/config/firebase/firestore";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import {
  buildApplicationTitle,
  errorMessage,
  filterApplicationHistory,
  formatDateInput,
  formatTimeInput,
  validateReminderInputs,
  type ApplicationHistoryItem,
  type HistoryFilter,
} from "./applicationDetails.helpers";
import {
  resolveFollowUpDate,
  type OutcomeOption,
} from "./applicationDetails.outcomes";
import type { ApplicationDetailsText } from "./applicationDetails.text";

const HISTORY_LIMIT = 50;

export interface ReminderRow {
  /** Stable client-only id for list rendering and removal */
  id: string;
  date: string;
  time: string;
  text: string;
}

// Opaque, prefixed client id. Uses crypto.randomUUID() (with a crypto fallback,
// matching the project's uidLike pattern) instead of Math.random — clears
// sonarjs/pseudo-random. These ids are only used as React keys / local row
// tracking / history correlation tokens; their format is never parsed.
function createClientId(prefix: string): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return `${prefix}-${c.randomUUID()}`;
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}-${hex}`;
}

function makeRowId(): string {
  return createClientId("r");
}

function logRestError(context: string, e: unknown): void {
  if (e instanceof ApiError && e.requestId) {
    console.error(context, {
      status: e.status,
      code: e.code,
      requestId: e.requestId,
    });
  }
}

function tomorrowAt9(): { date: string; time: string } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return { date: formatDateInput(tomorrow), time: formatTimeInput(tomorrow) };
}

function freshRow(): ReminderRow {
  const { date, time } = tomorrowAt9();
  return { id: makeRowId(), date, time, text: "" };
}

function rowsFromApp(app: ApplicationDoc | null): ReminderRow[] {
  const stored = app?.process.reminders;
  if (stored && stored.length > 0) {
    return stored.map((entry) => ({
      id: entry.id,
      date: formatDateInput(entry.at),
      time: formatTimeInput(entry.at),
      text: entry.text ?? "",
    }));
  }
  // Fallback to legacy nextActionAt/Text as a single row
  if (app?.process.nextActionAt) {
    return [
      {
        id: makeRowId(),
        date: formatDateInput(app.process.nextActionAt),
        time: formatTimeInput(app.process.nextActionAt),
        text: app.process.nextActionText ?? "",
      },
    ];
  }
  return [];
}

export function useApplicationDetailsController() {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const { userId, isAuthReady } = useAuthSelectors();

  const [app, setApp] = useState<ApplicationDoc | null>(null);
  const [history, setHistory] = useState<ApplicationHistoryItem[]>([]);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [reminderRows, setReminderRows] = useState<ReminderRow[]>([]);
  const [contactOptions, setContactOptions] = useState<
    { id: string; label: string }[]
  >([]);

  const loadApplication = useCallback(async () => {
    if (!userId || !appId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextApp, nextHistory, nextDocuments] = await Promise.all([
        getApplicationByIdViaRest(userId, appId),
        getApplicationHistoryViaRest(appId, HISTORY_LIMIT),
        listApplicationDocumentsViaRest(appId),
      ]);

      setApp(nextApp.data);
      setHistory(nextHistory);
      setDocuments(nextDocuments.items);
      setDocumentsTotal(nextDocuments.total);
    } catch (nextError: unknown) {
      logRestError("ApplicationDetailsPage core load failed", nextError);
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [appId, userId]);

  useEffect(() => {
    if (!isAuthReady || !userId || !appId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      loadApplication().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [appId, isAuthReady, loadApplication, userId]);

  // Load contacts for this application (one-shot — light data, OK without listener)
  useEffect(() => {
    if (!isAuthReady || !userId || !appId) return;
    let cancelled = false;
    getContactsByApplication(db, userId, appId)
      .then((rows) => {
        if (cancelled) return;
        const options = rows.map((row) => ({
          id: row.id,
          label: getContactFullName(row.data) || row.data.firstName || row.id,
        }));
        setContactOptions(options);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [appId, isAuthReady, userId]);

  const refreshDocuments = useCallback(async () => {
    if (!appId) return;

    setIsDocumentsLoading(true);
    setError(null);
    try {
      const nextDocuments = await listApplicationDocumentsViaRest(appId);
      setDocuments(nextDocuments.items);
      setDocumentsTotal(nextDocuments.total);
    } catch (nextError: unknown) {
      logRestError("ApplicationDetailsPage documents load failed", nextError);
      setError(errorMessage(nextError));
    } finally {
      setIsDocumentsLoading(false);
    }
  }, [appId]);

  const downloadDocument = useCallback(
    async (documentId: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await downloadDocumentViaRest(documentId);
        const filename =
          response.filename ??
          documents.find((item) => item.id === documentId)?.originalFilename ??
          "document";
        const objectUrl = URL.createObjectURL(response.blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (nextError: unknown) {
        logRestError(
          "ApplicationDetailsPage document download failed",
          nextError,
        );
        setError(errorMessage(nextError));
      } finally {
        setIsMutating(false);
      }
    },
    [documents],
  );

  const deleteDocument = useCallback(async (documentId: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await deleteDocumentViaRest(documentId);
      setDocuments((prev) => prev.filter((item) => item.id !== documentId));
      setDocumentsTotal((prev) => Math.max(0, prev - 1));
    } catch (nextError: unknown) {
      logRestError("ApplicationDetailsPage document delete failed", nextError);
      setError(errorMessage(nextError));
    } finally {
      setIsMutating(false);
    }
  }, []);

  const uploadDocument = useCallback(
    async (file: File, kind: DocumentKind) => {
      if (!appId) return;

      const validation = validateApplicationDocumentUploadFile(file);
      if (!validation.ok) {
        setError(validation.message ?? "Файл нельзя загрузить.");
        return;
      }

      setIsMutating(true);
      setError(null);
      try {
        const uploadedDocument = await uploadApplicationDocumentViaRest(appId, {
          file,
          kind,
        });
        setDocuments((prev) => [
          uploadedDocument,
          ...prev.filter((item) => item.id !== uploadedDocument.id),
        ]);
        setDocumentsTotal((prev) => prev + 1);
      } catch (nextError: unknown) {
        logRestError(
          "ApplicationDetailsPage document upload failed",
          nextError,
        );
        setError(errorMessage(nextError));
      } finally {
        setIsMutating(false);
      }
    },
    [appId],
  );

  const title = useMemo(() => buildApplicationTitle(app), [app]);
  const filteredHistory = useMemo(
    () => filterApplicationHistory(history, historyFilter),
    [history, historyFilter],
  );

  // Sync reminder rows from server state when the app loads or its reminders change
  useEffect(() => {
    setReminderRows(rowsFromApp(app));
    // We intentionally key only on the reminders + legacy fields so user edits
    // aren't blown away by unrelated app state changes.
  }, [
    app?.process.reminders,
    app?.process.nextActionAt,
    app?.process.nextActionText,
  ]);

  const goBack = useCallback(() => {
    Promise.resolve(navigate(RoutePath[AppRoutes.APPLICATIONS])).catch(
      () => undefined,
    );
  }, [navigate]);

  const changeApplicationStatus = useCallback(
    async (nextStatus: ProcessStatus) => {
      if (!userId || !appId) {
        return;
      }

      const previousApp = app;
      const previousHistory = history;

      setIsMutating(true);
      setError(null);

      // Optimistic update — UI reacts immediately, no full page reload
      if (previousApp) {
        const optimisticApp: ApplicationDoc = {
          ...previousApp,
          process: {
            ...previousApp.process,
            status: nextStatus,
            lastStatusChangeAt: Timestamp.now(),
          },
        };
        const optimisticEvent: ApplicationHistoryItem = {
          id: `optimistic-${Date.now()}`,
          data: {
            createdAt: Timestamp.now(),
            actor: "user",
            type: "STATUS_CHANGE",
            fromStatus: previousApp.process.status,
            toStatus: nextStatus,
          },
        };
        setApp(optimisticApp);
        setHistory((prev) => [optimisticEvent, ...prev]);
      }

      try {
        await changeApplicationStatusViaRest(userId, appId, {
          toStatus: nextStatus,
        });
        // Silent refetch in background — no isLoading flicker, just reconcile data
        const [nextApp, nextHistory] = await Promise.all([
          getApplicationByIdViaRest(userId, appId),
          getApplicationHistoryViaRest(appId, HISTORY_LIMIT),
        ]);
        setApp(nextApp.data);
        setHistory(nextHistory);
      } catch (nextError: unknown) {
        logRestError("ApplicationDetailsPage status change failed", nextError);
        // Revert optimistic update on failure
        setApp(previousApp);
        setHistory(previousHistory);
        setError(errorMessage(nextError));
      } finally {
        setIsMutating(false);
      }
    },
    [app, appId, history, userId],
  );

  const addApplicationComment = useCallback(async () => {
    if (!userId || !appId) {
      return;
    }

    const text = commentText.trim();
    if (!text) {
      return;
    }

    const previousHistory = history;
    setIsMutating(true);
    setError(null);

    // Optimistic comment append
    const optimisticEvent: ApplicationHistoryItem = {
      id: `optimistic-${Date.now()}`,
      data: {
        createdAt: Timestamp.now(),
        actor: "user",
        type: "COMMENT",
        comment: text,
      },
    };
    setHistory((prev) => [optimisticEvent, ...prev]);
    setCommentText("");

    try {
      await createApplicationCommentViaRest(appId, text);
      // Silent reconcile
      const nextHistory = await getApplicationHistoryViaRest(
        appId,
        HISTORY_LIMIT,
      );
      setHistory(nextHistory);
    } catch (nextError: unknown) {
      logRestError("ApplicationDetailsPage comment creation failed", nextError);
      setHistory(previousHistory);
      setCommentText(text);
      setError(errorMessage(nextError));
    } finally {
      setIsMutating(false);
    }
  }, [appId, commentText, history, userId]);

  // ─── Reminders helpers ────────────────────────────────────────────────────
  /** Persist any rows that resolve to a valid future datetime. */
  const persistRows = useCallback(
    async (rows: ReminderRow[]) => {
      if (!userId || !appId) return;

      const valid = rows
        .map((row) => {
          const result = validateReminderInputs(row.date, row.time);
          return result.code === "ok" && result.date
            ? { id: row.id, at: result.date, text: row.text.trim() }
            : null;
        })
        .filter(
          (entry): entry is { id: string; at: Date; text: string } =>
            entry !== null,
        );

      setIsMutating(true);
      setError(null);
      try {
        await setReminders(db, userId, appId, valid);
        await loadApplication();
      } catch (nextError: unknown) {
        logRestError(
          "ApplicationDetailsPage reminder outcome status change failed",
          nextError,
        );
        setError(errorMessage(nextError));
      } finally {
        setIsMutating(false);
      }
    },
    [appId, loadApplication, userId],
  );

  const upsertReminder = useCallback(
    (row: ReminderRow) => {
      setReminderRows((prev) => {
        const exists = prev.some((r) => r.id === row.id);
        const next = exists
          ? prev.map((r) => (r.id === row.id ? row : r))
          : [...prev, row];
        Promise.resolve(persistRows(next)).catch(() => undefined);
        return next;
      });
    },
    [persistRows],
  );

  const removeReminderRow = useCallback(
    (rowId: string) => {
      setReminderRows((prev) => {
        const next = prev.filter((row) => row.id !== rowId);
        Promise.resolve(persistRows(next)).catch(() => undefined);
        return next;
      });
    },
    [persistRows],
  );

  /**
   * Mark a reminder as completed: remove it from the list AND log a
   * COMMENT into history so the user has an audit trail.
   */
  const completeReminder = useCallback(
    (rowId: string, doneCommentLabel: string) => {
      const row = reminderRows.find((r) => r.id === rowId);
      if (!row) return;

      const note = row.text.trim() ? ` — ${row.text.trim()}` : "";
      const commentBody = `${doneCommentLabel}${note}`;

      // Optimistic history append (so the History tab counter ticks up immediately).
      const optimisticEvent: ApplicationHistoryItem = {
        id: `optimistic-${Date.now()}`,
        data: {
          createdAt: Timestamp.now(),
          actor: "user",
          type: "COMMENT",
          comment: commentBody,
        },
      };
      setHistory((prev) => [optimisticEvent, ...prev]);

      // Remove the reminder + persist + log a real comment.
      setReminderRows((prev) => {
        const next = prev.filter((r) => r.id !== rowId);
        Promise.resolve(persistRows(next)).catch(() => undefined);
        return next;
      });

      if (userId && appId) {
        Promise.resolve(createApplicationCommentViaRest(appId, commentBody))
          .then(() => loadApplication())
          .catch((nextError: unknown) => {
            logRestError(
              "ApplicationDetailsPage reminder comment creation failed",
              nextError,
            );
            setError(errorMessage(nextError));
          });
      }
    },
    [appId, loadApplication, persistRows, reminderRows, userId],
  );

  /**
   * Snooze a reminder by an offset (in minutes), starting from NOW (not the
   * original time). This is what users intuitively expect for an overdue item.
   */
  const snoozeReminder = useCallback(
    (rowId: string, minutesFromNow: number) => {
      const target = new Date();
      target.setMinutes(target.getMinutes() + minutesFromNow);

      setReminderRows((prev) => {
        const next = prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                date: formatDateInput(target),
                time: formatTimeInput(target),
              }
            : row,
        );
        Promise.resolve(persistRows(next)).catch(() => undefined);
        return next;
      });
    },
    [persistRows],
  );

  /**
   * Snooze to a specific datetime (used by the "Tomorrow 09:00" preset).
   */
  const snoozeReminderTo = useCallback(
    (rowId: string, target: Date) => {
      setReminderRows((prev) => {
        const next = prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                date: formatDateInput(target),
                time: formatTimeInput(target),
              }
            : row,
        );
        Promise.resolve(persistRows(next)).catch(() => undefined);
        return next;
      });
    },
    [persistRows],
  );

  /** Build a fresh row template (used by Add reminder button). */
  const buildEmptyRow = useCallback((): ReminderRow => freshRow(), []);

  /**
   * Apply the outcome of a reminder.
   *
   * In one logical action:
   *   1. Remove the source reminder
   *   2. Optionally schedule a follow-up reminder
   *   3. Optionally change application status
   *   4. Always log a comment to history (audit trail)
   *
   * Operations are sequenced (not batched) intentionally so a partial
   * failure still leaves the most useful side effects in place.
   *
   * Optimistic UI: history gets the comment immediately, reminder list
   * gets the new shape immediately. Reconcile via loadApplication() at end.
   */
  const applyReminderOutcome = useCallback(
    async (params: {
      sourceRowId: string;
      outcome: OutcomeOption;
      /** Override the canonical comment (when option requires custom input). */
      commentOverride?: string | undefined;
      /** Override follow-up date (when timing.kind === "manual"). */
      followUpAt?: Date | null | undefined;
      /** Optional contact label appended to the history comment. */
      contactLabel?: string | null | undefined;
      text: ApplicationDetailsText;
    }) => {
      if (!userId || !appId) return;

      const sourceRow = reminderRows.find((r) => r.id === params.sourceRowId);
      if (!sourceRow) return;

      const baseComment = (
        params.commentOverride?.trim() ||
        params.text[params.outcome.commentKey] ||
        params.text.reminderHistoryDoneTitle
      ).toString();

      const sourceNote = sourceRow.text.trim();
      const contactSuffix = params.contactLabel?.trim()
        ? ` (${params.contactLabel.trim()})`
        : "";
      const sourceSuffix = sourceNote ? ` — ${sourceNote}` : "";
      const commentBody = `${baseComment}${contactSuffix}${sourceSuffix}`;

      // Single correlation id for both events emitted by this action so the
      // History tab can render them as one logical block.
      const correlationId = createClientId("wzd");

      // Optimistic comment in history
      const optimisticComment: ApplicationHistoryItem = {
        id: `optimistic-${Date.now()}`,
        data: {
          createdAt: Timestamp.now(),
          actor: "user",
          type: "COMMENT",
          comment: commentBody,
          correlationId,
        },
      };
      setHistory((prev) => [optimisticComment, ...prev]);

      // Compute next reminder list locally (optimistic)
      const followUpDate = (() => {
        if (!params.outcome.followUp) return null;
        if (params.outcome.followUp.timing.kind === "manual") {
          return params.followUpAt ?? null;
        }
        return resolveFollowUpDate(params.outcome.followUp.timing);
      })();

      const followUpNote = params.outcome.followUp?.noteKey
        ? String(params.text[params.outcome.followUp.noteKey] ?? "")
        : "";

      let nextRows = reminderRows.filter((r) => r.id !== params.sourceRowId);
      if (followUpDate) {
        const newRow: ReminderRow = {
          id: `r-${Date.now()}`,
          date: formatDateInput(followUpDate),
          time: formatTimeInput(followUpDate),
          text: followUpNote,
        };
        nextRows = [...nextRows, newRow];
      }
      setReminderRows(nextRows);

      setIsMutating(true);
      setError(null);
      try {
        // Persist reminders (always, even when only removing)
        await persistRows(nextRows);

        // Status change (optional) — tagged with correlationId for grouping
        if (params.outcome.statusChange) {
          await changeApplicationStatusViaRest(userId, appId, {
            toStatus: params.outcome.statusChange,
            correlationId,
          });
        }

        // Real comment (optimistic comment was UI-only) — same correlation id
        await createApplicationCommentViaRest(appId, {
          text: commentBody,
          correlationId,
        });

        await loadApplication();
      } catch (nextError: unknown) {
        logRestError(
          "ApplicationDetailsPage reminder outcome status change failed",
          nextError,
        );
        setError(errorMessage(nextError));
      } finally {
        setIsMutating(false);
      }
    },
    [appId, loadApplication, persistRows, reminderRows, userId],
  );

  const historyHasMore = history.length >= HISTORY_LIMIT;

  return {
    app,
    title,
    filteredHistory,
    historyTotalCount: history.length,
    historyHasMore,
    documents,
    documentsTotal,
    isDocumentsLoading,
    isLoading,
    isMutating,
    error,
    commentText,
    historyFilter,
    reminderRows,
    setCommentText,
    setHistoryFilter,
    upsertReminder,
    removeReminderRow,
    completeReminder,
    snoozeReminder,
    snoozeReminderTo,
    applyReminderOutcome,
    contactOptions,
    buildEmptyRow,
    goBack,
    changeApplicationStatus,
    addApplicationComment,
    refreshDocuments,
    downloadDocument,
    deleteDocument,
    uploadDocument,
    appId,
  };
}
