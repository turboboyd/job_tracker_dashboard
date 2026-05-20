import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { joinTitles } from "src/entities/loop/lib";
import type { Loop } from "src/entities/loop/model";
import { LoopSearchLinks } from "src/entities/loop/ui/LoopSearchLinks/LoopSearchLinks";
import { getLoopViaRest, updateLoopViaRest } from "src/features/loops";
import { db } from "src/shared/config/firebase/firebase";
import {
  setLastLoopsUrl,
  setLoopDetailsPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage } from "src/shared/lib";
import { updateURLParams } from "src/shared/lib/url/updateURLParams";
import { Modal } from "src/shared/ui";

import { createApplicationsRepo } from "src/pages/ApplicationsPage/api/applicationsRepo";
import {
  buildCreateApplicationPayload,
  canSubmitApplicationForm,
  getLoopTargetRole,
} from "src/pages/ApplicationsPage/model/applicationsPage.helpers";
import {
  EMPTY_CREATE_FORM,
  type CreateFormState,
} from "src/pages/ApplicationsPage/model/types";
import { CreateApplicationDialog } from "src/pages/ApplicationsPage/ui/CreateApplicationDialog";
import { CardText } from "./Header";
import { ArbeitsagenturDiscoveryPreviewPanel } from "./ArbeitsagenturDiscoveryPreviewPanel";
import { LoopSettingsPanel } from "./LoopSettingsPanel";
import { VacancyMatchesSection } from "./VacancyMatchesSection";
import { isBackendLoopId } from "./loopsPage.helpers";

export function LoopDetailsView({
  userId,
  loopId,
  onBack,
}: {
  userId: string;
  loopId: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const applicationsRepo = useMemo(() => createApplicationsRepo(db), []);

  const savedDetailsPage = useAppSelector(
    (s) => s.loopsUi.detailsPageByLoopId[loopId],
  );
  const [loop, setLoop] = useState<Loop | null>(null);
  const [isLoadingLoop, setIsLoadingLoop] = useState(false);
  const [loopError, setLoopError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateApplicationOpen, setIsCreateApplicationOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [createApplicationError, setCreateApplicationError] = useState<string | null>(null);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);

  const readPageFromSearch = (search: string): number | null => {
    try {
      const sp = new URLSearchParams(search);
      const raw = sp.get("page");
      const n = raw ? Number(raw) : NaN;
      const i = Number.isFinite(n) ? Math.trunc(n) : NaN;
      return i > 0 ? i : null;
    } catch {
      return null;
    }
  };

  const urlPage = readPageFromSearch(location.search);
  const detailsPage = urlPage ?? savedDetailsPage ?? 1;

  // если page отсутствует в URL — проставим (replace), чтобы ссылка была шарится
  useEffect(() => {
    if (urlPage !== null) return;

    updateURLParams(
      navigate,
      location,
      { page: String(detailsPage) },
      { replace: true },
    );
  }, [urlPage, detailsPage, navigate, location]);

  // держим Redux в синхроне с фактической страницей
  useEffect(() => {
    dispatch(setLoopDetailsPage({ loopId, page: detailsPage }));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, loopId, detailsPage, location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadLoop() {
      if (!isBackendLoopId(loopId)) {
        setLoop(null);
        setLoopError(t("loops.notFound", "Loop not found."));
        return;
      }

      setIsLoadingLoop(true);
      setLoopError(null);
      try {
        const item = await getLoopViaRest(loopId);
        if (!cancelled) setLoop(item);
      } catch (error: unknown) {
        if (!cancelled) {
          setLoop(null);
          setLoopError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) setIsLoadingLoop(false);
      }
    }

    void loadLoop();

    return () => {
      cancelled = true;
    };
  }, [loopId, t]);

  const title = useMemo(
    () => loop?.name ?? t("loops.detailsTitle", "Loop"),
    [loop?.name, t],
  );

  const subtitle = useMemo(() => {
    if (!loop) {
      return t(
        "loops.detailsHint",
        "Change filters → Apply → links update and filters persist.",
      );
    }

    const roles = joinTitles(loop.titles) || t("loops.dash", "—");
    const remoteText =
      loop.remoteMode === "remote_only"
        ? t("loops.remoteOnly", "Remote")
        : t("loops.any", "Any");

    return `${roles} · ${loop.location} · ${remoteText}`;
  }, [loop, t]);

  const updateCreateForm = useCallback(
    <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
      setCreateForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const openCreateApplicationDialog = useCallback(() => {
    if (!loop) return;

    setCreateApplicationError(null);
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      loopId: loop.id,
      roleTitle: getLoopTargetRole(loop),
    });
    setIsCreateApplicationOpen(true);
  }, [loop]);

  const closeCreateApplicationDialog = useCallback(() => {
    setIsCreateApplicationOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
  }, []);

  const selectCreateApplicationLoop = useCallback((nextLoopId: string) => {
    if (!loop || nextLoopId !== loop.id) {
      setCreateForm((current) => ({ ...current, loopId: "" }));
      return;
    }

    setCreateForm((current) => ({
      ...current,
      loopId: loop.id,
      roleTitle: current.roleTitle.trim() ? current.roleTitle : getLoopTargetRole(loop),
    }));
  }, [loop]);

  const canCreateApplication = useMemo(
    () => canSubmitApplicationForm(createForm),
    [createForm],
  );

  const handleCreateApplication = useCallback(async () => {
    if (!userId || !loop || !canCreateApplication) return;

    setIsCreatingApplication(true);
    setCreateApplicationError(null);
    try {
      await applicationsRepo.createApplication(
        userId,
        buildCreateApplicationPayload({ ...createForm, loopId: loop.id }),
      );
      closeCreateApplicationDialog();
    } catch (error: unknown) {
      setCreateApplicationError(getErrorMessage(error));
    } finally {
      setIsCreatingApplication(false);
    }
  }, [
    applicationsRepo,
    canCreateApplication,
    closeCreateApplicationDialog,
    createForm,
    loop,
    userId,
  ]);

  const content = useMemo(() => {
    if (isLoadingLoop) {
      return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
    }

    if (loopError) {
      return <CardText>{loopError}</CardText>;
    }

    if (!loop) {
      return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;
    }

    return (
      <>
      <LoopSearchLinks
        userId={userId}
        page={detailsPage}
        onPageChange={(p) => {
          dispatch(setLoopDetailsPage({ loopId, page: p }));
          updateURLParams(
            navigate,
            location,
            { page: String(p) },
            { replace: true },
          );
        }}
        loop={{
          id: loop.id,
          name: loop.name,
          titles: loop.titles,
          location: loop.location,
          radiusKm: loop.radiusKm,
          platforms: loop.platforms,
          remoteMode: loop.remoteMode,
          filters: loop.filters,
        }}
        onUpdateLoop={async (patch) => {
          const updated = await updateLoopViaRest(loop.id, patch);
          setLoop(updated);
        }}
        onAddVacancy={openCreateApplicationDialog}
      />
      {isBackendLoopId(loop.id) ? (
        <ArbeitsagenturDiscoveryPreviewPanel
          loopId={loop.id}
          selectedSources={loop.selectedSources}
          onMatchSaved={() => setMatchesRefreshKey((current) => current + 1)}
        />
      ) : null}
      {isBackendLoopId(loop.id) ? (
        <VacancyMatchesSection
          loopId={loop.id}
          reloadKey={matchesRefreshKey}
          onAddVacancy={openCreateApplicationDialog}
          onOpenSources={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      ) : null}
      </>
    );
  }, [
    isLoadingLoop,
    loopError,
    loop,
    t,
    userId,
    detailsPage,
    dispatch,
    loopId,
    navigate,
    location,
    openCreateApplicationDialog,
    matchesRefreshKey,
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={onBack}
              >
                {t("loops.listTitle", "Loops")}
              </button>
              <span>/</span>
              <span className="text-muted-foreground">{title}</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {loop ? (
              <>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  Настройки направления поиска
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  onClick={openCreateApplicationDialog}
                >
                  Добавить вакансию
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              onClick={onBack}
            >
              ← {t("loops.back", "Back")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7">
          {content}
          {createApplicationError ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {createApplicationError}
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={isSettingsOpen && Boolean(loop)}
        onOpenChange={setIsSettingsOpen}
        title="Настройки направления поиска"
        description="Параметры сохраняются в backend. Автоматический поиск вакансий пока не подключён."
        size="lg"
      >
        {loop ? (
          <LoopSettingsPanel
            loop={loop}
            onSave={async (patch) => {
              const updated = await updateLoopViaRest(loop.id, patch);
              setLoop(updated);
              return updated;
            }}
          />
        ) : null}
      </Modal>

      {loop ? (
        <CreateApplicationDialog
          isOpen={isCreateApplicationOpen}
          onClose={closeCreateApplicationDialog}
          form={createForm}
          onChange={updateCreateForm}
          onCreate={handleCreateApplication}
          canSubmit={canCreateApplication}
          isCreating={isCreatingApplication}
          activeLoops={loop.status === "archived" ? [] : [loop]}
          isLoadingLoops={false}
          onSelectLoop={selectCreateApplicationLoop}
          initialLoopId={loop.id}
          initialMode="import"
          onCreateLoopRequested={() => {
            setIsCreateApplicationOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
