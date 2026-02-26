import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ApplicationDoc,
  ApplicationsRepo,
  ProcessStatus,
} from "../api/applicationsRepo";

import type { PipelineFilterStatus, ViewMode } from "./types";
import { EMPTY_CREATE_FORM, type CreateFormState } from "./types";

export type AppRow = { id: string; data: ApplicationDoc };

export function useApplicationsPage(params: {
  userId: string | null;
  isAuthReady: boolean;
  repo: ApplicationsRepo;
}) {
  const { userId, isAuthReady, repo } = params;

  const [view, setView] = useState<ViewMode>("pipeline");
  const [activeStatus, setActiveStatus] = useState<PipelineFilterStatus>("ALL");

  const [form, setForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);

  const [isEnsuringUser, setIsEnsuringUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [list, setList] = useState<AppRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.companyName.trim().length > 0 && form.roleTitle.trim().length > 0;
  }, [form.companyName, form.roleTitle]);

  // Ensure user document exists.
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    let cancelled = false;
    (async () => {
      try {
        setIsEnsuringUser(true);
        await repo.ensureUserDoc(userId);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsEnsuringUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [repo, isAuthReady, userId]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const load = useCallback(async () => {
    if (!userId) return;

    setIsLoadingList(true);
    setError(null);

    try {
      if (view === "pipeline") {
        // ✅ NEW: ALL shows all active applications (same base dataset as dashboard etc.)
        if (activeStatus === "ALL") {
          const rows = await repo.queryAllActiveApplications(userId, 500);
          const changed = await repo.autoMarkGhosting(userId, rows);
          if (changed > 0) {
            const fresh = await repo.queryAllActiveApplications(userId, 500);
            setList(fresh);
          } else {
            setList(rows);
          }
          return;
        }

        const rows = await repo.queryPipelineByStatus(userId, activeStatus as ProcessStatus, 50);
        // Client-side automation: mark ghosting (NO_RESPONSE) after 30 days since appliedAt.
        const changed = await repo.autoMarkGhosting(userId, rows);
        if (changed > 0) {
          const fresh = await repo.queryPipelineByStatus(userId, activeStatus as ProcessStatus, 50);
          setList(fresh);
        } else {
          setList(rows);
        }
        return;
      }

      if (view === "today") {
        const rows = await repo.queryTodayTopPriority(userId, 50);
        const changed = await repo.autoMarkGhosting(userId, rows);
        if (changed > 0) {
          const fresh = await repo.queryTodayTopPriority(userId, 50);
          setList(fresh);
        } else {
          setList(rows);
        }
        return;
      }

      const rows = await repo.queryFollowUpsDue(userId, 50);
      const changed = await repo.autoMarkGhosting(userId, rows);
      if (changed > 0) {
        const fresh = await repo.queryFollowUpsDue(userId, 50);
        setList(fresh);
      } else {
        setList(rows);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setIsLoadingList(false);
    }
  }, [repo, activeStatus, userId, view]);

  // Reload list when auth/view/status changes.
  useEffect(() => {
    if (!isAuthReady || !userId) return;
    void load();
  }, [isAuthReady, userId, load]);

  const updateForm = useCallback(
    <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
      setForm((prev: CreateFormState) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetForm = useCallback(() => setForm(EMPTY_CREATE_FORM), []);

  const onCreate = useCallback(async () => {
    if (!userId || !canSubmit) return;

    setIsCreating(true);
    setError(null);

    try {
      await repo.createApplication(userId, {
        companyName: form.companyName.trim(),
        roleTitle: form.roleTitle.trim(),
        vacancyUrl: form.vacancyUrl.trim().length ? form.vacancyUrl.trim() : undefined,
        source: form.source.trim().length ? form.source.trim() : undefined,
        status: "SAVED",
        rawDescription: form.rawDescription.trim().length
          ? form.rawDescription.trim()
          : undefined,
      });

      resetForm();
      setView("pipeline");
      // ✅ After create keep user in ALL (so the new card is visible without confusion)
      setActiveStatus("ALL");

      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }, [repo, userId, canSubmit, form, resetForm, load]);

  return {
    // View
    view,
    setView,
    activeStatus,
    setActiveStatus,

    // Create form
    form,
    updateForm,
    resetForm,
    canSubmit,
    onCreate,

    // Data
    list,
    load,

    // UI states
    isEnsuringUser,
    isCreating,
    isLoadingList,
    error,
    setError,
  };
}