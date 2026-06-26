import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import { listLoopsViaRest } from "src/features/loops";
import { ApiError } from "src/shared/api/rest/restClient";

import type {
  ApplicationDoc,
  ApplicationsRepo,
  ProcessStatus,
} from "../api/applicationsRepo";

import {
  applyApplicationStatusOptimisticUpdate,
  buildCreateApplicationPayload,
  buildLoopTitleMap,
  calculateStatusCounts,
  canSubmitApplicationForm,
  filterFollowUpApplications,
  filterSelectableApplicationLoops,
  filterTodayApplications,
  getLoopTargetRole,
  getNextRoleTitleAfterLoopSelect,
  isBackendLoopId,
  mergeApplicationRow,
} from "./applicationsPage.helpers";
import { EMPTY_CREATE_FORM, type CreateFormState } from "./types";
import type { PipelineFilterStatus, ViewMode } from "./types";

export type AppRow = { id: string; data: ApplicationDoc };

export type NewApplicationContactInput = {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
};

export function useApplicationsPage(params: {
  userId: string | null;
  isAuthReady: boolean;
  repo: ApplicationsRepo;
  loopFilterId?: string | null;
}) {
  const { userId, isAuthReady, repo, loopFilterId = null } = params;
  const { t } = useTranslation();

  const archivedLoopError = useCallback(
    () =>
      t(
        "applicationsPage.errors.archivedLoop",
        "This search direction is archived. Restore it first to add new applications.",
      ),
    [t],
  );

  const [view, setView] = useState<ViewMode>("pipeline");
  const [activeStatus, setActiveStatus] = useState<PipelineFilterStatus>("ALL");

  const [form, setForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const roleTitleManuallyEditedRef = useRef(false);

  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);
  const [loopsError, setLoopsError] = useState<unknown>(null);
  const validLoopFilterId = useMemo(
    () => (loopFilterId && isBackendLoopId(loopFilterId) ? loopFilterId : null),
    [loopFilterId],
  );
  const activeLoops = useMemo(() => filterSelectableApplicationLoops(loops), [loops]);
  const loopFilter = useMemo(
    () => loops.find((loop) => loop.id === validLoopFilterId) ?? null,
    [loops, validLoopFilterId],
  );
  const loopTitleById = useMemo(() => buildLoopTitleMap(loops), [loops]);

  const [isEnsuringUser, setIsEnsuringUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [allList, setAllList] = useState<AppRow[]>([]);
  const [countSourceList, setCountSourceList] = useState<AppRow[]>([]);
  const [pageTotal, setPageTotal] = useState(0);
  const [pageLimit, setPageLimit] = useState(20);
  const [pageOffset, setPageOffset] = useState(0);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => canSubmitApplicationForm(form), [form]);

  const selectLoop = useCallback((loop: Loop) => {
    setForm((prev) => ({
      ...prev,
      loopId: loop.id,
      roleTitle: getNextRoleTitleAfterLoopSelect({
        currentRoleTitle: prev.roleTitle,
        targetRole: getLoopTargetRole(loop),
        wasManuallyEdited: roleTitleManuallyEditedRef.current,
      }),
    }));
  }, []);

  const selectLoopById = useCallback((loopId: string) => {
    const loop = activeLoops.find((item) => item.id === loopId);
    if (!loop) {
      setForm((prev) => ({ ...prev, loopId: "" }));
      setError(archivedLoopError());
      return;
    }

    setError(null);
    selectLoop(loop);
  }, [activeLoops, selectLoop, archivedLoopError]);

  const statusCounts = useMemo<Record<string, number>>(
    () => calculateStatusCounts(countSourceList),
    [countSourceList],
  );

  const viewCounts = useMemo(() => ({
    pipeline: countSourceList.length,
    today: filterTodayApplications(countSourceList).length,
    followups: filterFollowUpApplications(countSourceList).length,
  }), [countSourceList]);

  const list = useMemo<AppRow[]>(() => allList, [allList]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    let cancelled = false;
    void (async () => {
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

  useEffect(() => {
    if (form.loopId || activeLoops.length !== 1) return;
    selectLoop(activeLoops[0]);
  }, [activeLoops, form.loopId, selectLoop]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setLoops([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      setIsLoadingLoops(true);
      setLoopsError(null);
      try {
        const response = await listLoopsViaRest({ includeArchived: true, limit: 100 });
        if (!cancelled) setLoops(response.items);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setLoops([]);
          setLoopsError(loadError);
          logApplicationsPageRestError("ApplicationsPage loops load failed", loadError);
          setError(mapApplicationsPageError(loadError));
        }
      } finally {
        if (!cancelled) setIsLoadingLoops(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, userId]);

  const load = useCallback(async () => {
    if (!userId) return;

    setIsLoadingList(true);
    setError(null);

    try {
      const countRows = await loadApplicationsCountSource({
        repo,
        userId,
        showArchived,
        favoriteOnly,
        loopFilterId: validLoopFilterId,
      });
      setCountSourceList(countRows);

      if (view === "pipeline") {
        const result = await repo.queryApplicationsPage(userId, {
          archived: showArchived,
          status: activeStatus === "ALL" ? undefined : activeStatus,
          limit: pageLimit,
          offset: pageOffset,
          sort: "updated_at_desc",
          isFavorite: favoriteOnly ? true : undefined,
          loopId: validLoopFilterId ?? undefined,
        });
        setAllList(result.items);
        setPageTotal(result.total);
        setPageLimit(result.limit);
        setPageOffset(result.offset);
        return;
      }

      const scopedRows = favoriteOnly
        ? countRows.filter((row) => row.data.isFavorite === true)
        : countRows;
      const rows = view === "today"
        ? filterTodayApplications(scopedRows)
        : filterFollowUpApplications(scopedRows);
      const changed = await repo.autoMarkGhosting(userId, rows);
      if (changed > 0) {
        const refreshedRows = await loadApplicationsCountSource({
          repo,
          userId,
          showArchived,
          favoriteOnly,
          loopFilterId: validLoopFilterId,
        });
        setCountSourceList(refreshedRows);
        setAllList(view === "today"
          ? filterTodayApplications(refreshedRows)
          : filterFollowUpApplications(refreshedRows));
      } else {
        setAllList(rows);
      }
      setPageTotal(rows.length);
      setPageLimit((current) => Math.max(1, current));
      setPageOffset(0);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setIsLoadingList(false);
    }
  }, [
    repo,
    userId,
    view,
    activeStatus,
    favoriteOnly,
    showArchived,
    pageLimit,
    pageOffset,
    validLoopFilterId,
  ]);

  useEffect(() => {
    setPageOffset(0);
  }, [activeStatus, favoriteOnly, showArchived, view, validLoopFilterId]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    void load();
  }, [isAuthReady, userId, load]);

  const updateForm = useCallback(
    <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
      if (key === "roleTitle") roleTitleManuallyEditedRef.current = true;
      setForm((prev: CreateFormState) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    roleTitleManuallyEditedRef.current = false;
    setForm(EMPTY_CREATE_FORM);
  }, []);

  const onChangeStatus = useCallback(
    async (appId: string, status: ProcessStatus) => {
      if (!userId) return;

      setError(null);
      const previousAllList = allList;
      const previousCountSourceList = countSourceList;

      setAllList((current) => applyApplicationStatusOptimisticUpdate(current, appId, status));
      setCountSourceList((current) => applyApplicationStatusOptimisticUpdate(current, appId, status));

      try {
        const updatedRow = await repo.changeStatus(userId, appId, status);
        setAllList((current) => mergeApplicationRow(current, updatedRow));
        setCountSourceList((current) => mergeApplicationRow(current, updatedRow));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setAllList(previousAllList);
        setCountSourceList(previousCountSourceList);
        setError(message);
      }
    },
    [allList, countSourceList, repo, userId],
  );

  const onCreate = useCallback(async () => {
    if (!userId || !canSubmit) return;

    const selectedLoop = activeLoops.find((loop) => loop.id === form.loopId);
    if (!selectedLoop) {
      setError(archivedLoopError());
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await repo.createApplication(userId, buildCreateApplicationPayload(form));

      resetForm();
      setView("pipeline");
      setActiveStatus("ALL");

      await load();
    } catch (e: unknown) {
      const message = mapApplicationsPageError(e);
      logApplicationsPageRestError("ApplicationsPage create failed", e);
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }, [activeLoops, repo, userId, canSubmit, form, resetForm, load, archivedLoopError]);

  const goToPreviousPage = useCallback(() => {
    setPageOffset((current) => Math.max(0, current - pageLimit));
  }, [pageLimit]);

  const goToNextPage = useCallback(() => {
    setPageOffset((current) => {
      const next = current + pageLimit;
      return next >= pageTotal ? current : next;
    });
  }, [pageLimit, pageTotal]);

  const onToggleFavorite = useCallback(async (appId: string, nextValue: boolean) => {
    if (!userId) return;
    setError(null);
    setAllList((current) =>
      current.map((row) =>
        row.id === appId
          ? { ...row, data: { ...row.data, isFavorite: nextValue } }
          : row,
      ),
    );

    try {
      await repo.setFavorite(userId, appId, nextValue);
      await load();
    } catch (e: unknown) {
      const message = mapApplicationsPageError(e);
      logApplicationsPageRestError("ApplicationsPage favorite toggle failed", e);
      setError(message);
      await load();
    }
  }, [load, repo, userId]);

  const onArchiveApplication = useCallback(async (appId: string) => {
    if (!userId) return;
    const confirmed = window.confirm("Архивировать заявку?");
    if (!confirmed) return;

    setError(null);
    try {
      await repo.archiveApplication(userId, appId);
      setAllList((current) => current.filter((row) => row.id !== appId));
      await load();
    } catch (e: unknown) {
      const message = mapApplicationsPageError(e);
      logApplicationsPageRestError("ApplicationsPage archive failed", e);
      setError(message);
    }
  }, [load, repo, userId]);

  const onRestoreApplication = useCallback(async (appId: string) => {
    if (!userId) return;
    setError(null);

    try {
      await repo.restoreApplication(userId, appId);
      setAllList((current) => current.filter((row) => row.id !== appId));
      await load();
    } catch (e: unknown) {
      const message = mapApplicationsPageError(e);
      logApplicationsPageRestError("ApplicationsPage restore failed", e);
      setError(message);
    }
  }, [load, repo, userId]);

  return {
    view,
    setView,
    activeStatus,
    setActiveStatus,
    form,
    updateForm,
    resetForm,
    canSubmit,
    onCreate,
    activeLoops,
    loopTitleById,
    isLoadingLoops,
    loops,
    loopFilter,
    selectLoopById,
    allList,
    list,
    statusCounts,
    viewCounts,
    load,
    pageTotal,
    pageLimit,
    pageOffset,
    favoriteOnly,
    setFavoriteOnly,
    showArchived,
    setShowArchived,
    goToPreviousPage,
    goToNextPage,
    onChangeStatus,
    onToggleFavorite,
    onArchiveApplication,
    onRestoreApplication,
    isEnsuringUser,
    isCreating,
    isLoadingList,
    error: error ?? (loopsError ? mapApplicationsPageError(loopsError) : null),
    setError,
  };
}

function mapApplicationsPageError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function logApplicationsPageRestError(message: string, error: unknown): void {
  if (error instanceof ApiError) {
    console.error(message, {
      requestId: error.requestId,
      status: error.status,
      code: error.code,
    });
  }
}


async function loadApplicationsCountSource(params: {
  repo: ApplicationsRepo;
  userId: string;
  showArchived: boolean;
  favoriteOnly: boolean;
  loopFilterId: string | null;
}): Promise<AppRow[]> {
  const { repo, userId, showArchived, favoriteOnly, loopFilterId } = params;
  const firstPage = await repo.queryApplicationsPage(userId, {
    archived: showArchived,
    limit: 100,
    offset: 0,
    sort: "updated_at_desc",
    isFavorite: favoriteOnly ? true : undefined,
    loopId: loopFilterId ?? undefined,
  });

  const rows = [...firstPage.items];
  let nextOffset = firstPage.offset + firstPage.limit;

  while (nextOffset < firstPage.total) {
    const nextPage = await repo.queryApplicationsPage(userId, {
      archived: showArchived,
      limit: 100,
      offset: nextOffset,
      sort: "updated_at_desc",
      isFavorite: favoriteOnly ? true : undefined,
      loopId: loopFilterId ?? undefined,
    });
    rows.push(...nextPage.items);
    nextOffset = nextPage.offset + nextPage.limit;

    if (nextPage.items.length === 0) break;
  }

  return rows;
}
