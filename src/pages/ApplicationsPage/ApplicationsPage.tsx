import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth/model/hooks/useAuthSelectors";
import { db } from "src/shared/config/firebase/firebase";

import { createApplicationsRepo } from "./api/applicationsRepo";
import {
  readStoredApplicationsDisplayMode,
  writeStoredApplicationsDisplayMode,
  type ApplicationsDisplayMode,
} from "./model/applicationsPage.helpers";
import { useApplicationsPage } from "./model/useApplicationsPage";
import { ApplicationsListCard, ViewToggle } from "./ui/ApplicationsListCard";
import { ApplicationsToolbar } from "./ui/ApplicationsToolbar";
import { CreateApplicationDialog } from "./ui/CreateApplicationDialog";

type SortBy = "newest" | "oldest" | "company" | "score";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "company", label: "Company A–Z" },
  { value: "score", label: "Match score" },
];

function useRouteDrivenCreateDialogState(shouldOpenFromRoute: boolean) {
  const [isOpen, setIsOpen] = useState(shouldOpenFromRoute);
  const [previousShouldOpenFromRoute, setPreviousShouldOpenFromRoute] =
    useState(shouldOpenFromRoute);

  if (previousShouldOpenFromRoute !== shouldOpenFromRoute) {
    setPreviousShouldOpenFromRoute(shouldOpenFromRoute);
    if (shouldOpenFromRoute) setIsOpen(true);
  }

  return [isOpen, setIsOpen] as const;
}

export default function ApplicationsPage() {
  const { t } = useTranslation();
  const { userId, isAuthReady } = useAuthSelectors();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loopFilterId = searchParams.get("loopId");
  const initialCreateMode = searchParams.get("mode");
  const shouldOpenCreateDialog = searchParams.get("create") === "1";
  const repo = useMemo(() => createApplicationsRepo(db), []);

  const [isCreateOpen, setIsCreateOpen] =
    useRouteDrivenCreateDialogState(shouldOpenCreateDialog);
  const [displayMode, setDisplayModeState] = useState<ApplicationsDisplayMode>(() =>
    readStoredApplicationsDisplayMode() ?? "list",
  );
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Company filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  // Filtered count (surfaced from ApplicationsListCard)
  const [filteredCount, setFilteredCount] = useState(0);

  const {
    view,
    setView,
    activeStatus,
    setActiveStatus,

    form,
    updateForm,
    canSubmit,
    isCreating,
    onCreate,
    activeLoops,
    loopFilter,
    loopTitleById,
    isLoadingLoops,
    selectLoopById,

    allList,
    list,
    statusCounts,
    viewCounts,
    pageTotal,
    pageLimit,
    pageOffset,
    favoriteOnly,
    setFavoriteOnly,
    showArchived,
    setShowArchived,
    goToPreviousPage,
    goToNextPage,
    isLoadingList,
    error,

    onChangeStatus,
    onToggleFavorite,
    onArchiveApplication,
    onRestoreApplication,
  } = useApplicationsPage({ userId, isAuthReady, repo, loopFilterId });


  function setDisplayMode(mode: ApplicationsDisplayMode) {
    setDisplayModeState(mode);
    writeStoredApplicationsDisplayMode(mode);
  }

  function closeCreateDialog() {
    setIsCreateOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    next.delete("mode");
    setSearchParams(next, { replace: true });
  }

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!isSortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSortOpen]);

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  // Unique companies sorted alphabetically from allList
  const companyOptions = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const row of allList) {
      const name = row.data.job.companyName;
      countMap.set(name, (countMap.get(name) ?? 0) + 1);
    }
    return Array.from(countMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [allList]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  const VIEW_MODES = [
    { key: "pipeline" as const, label: t("applicationsPage.view.pipeline", "Pipeline") },
    { key: "today" as const, label: t("applicationsPage.view.today", "Today") },
    { key: "followups" as const, label: t("applicationsPage.view.followups", "Follow-ups") },
  ];

  function clearLoopFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("loopId");
    setSearchParams(next, { replace: true });
  }

  function toggleCompany(name: string) {
    setSelectedCompanies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <span className="text-muted-foreground">
                  {t("applicationsPage.title", "My Applications")}
                </span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                {t("applicationsPage.title", "My Applications")}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Создавай и отслеживай отклики в одном месте.
              </p>
            </div>

            <div className="flex items-center gap-2 pb-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("applicationsPage.searchPlaceholder", "Search company or role…")}
                  className="rounded-[8px] border border-border bg-muted/50 px-3 py-1.5 pl-8 text-[13px] w-[220px] focus:border-primary focus:outline-none"
                />
              </div>

              {/* Filters button */}
              <div ref={filterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Filter className="h-3.5 w-3.5 text-subtle-foreground" />
                  Фильтры
                  {selectedCompanies.length > 0 && (
                    <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {selectedCompanies.length}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-[12px] border border-border bg-background shadow-lg">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <span className="text-[12px] font-semibold text-foreground">Компании</span>
                      {selectedCompanies.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCompanies([])}
                          className="text-[11.5px] text-primary hover:underline"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                    <div className="max-h-[260px] overflow-y-auto px-2 pb-3">
                      {companyOptions.length === 0 ? (
                        <p className="px-2 py-2 text-[12px] text-muted-foreground">Нет данных</p>
                      ) : (
                        companyOptions.map(({ name, count }) => {
                          const checked = selectedCompanies.includes(name);
                          return (
                            <label
                              key={name}
                              className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCompany(name)}
                                className="h-3.5 w-3.5 rounded accent-primary"
                              />
                              <span className="flex-1 truncate text-[12.5px] text-foreground">
                                {name}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70">{count}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFavoriteOnly(!favoriteOnly)}
                className={[
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  favoriteOnly
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted",
                ].join(" ")}
              >
                ★ Избранные
              </button>

              {/* Sort dropdown */}
              <div ref={sortRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {currentSortLabel}
                  <ChevronDown className="h-3.5 w-3.5 text-subtle-foreground" />
                </button>
                {isSortOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-[8px] border border-border bg-card py-1 shadow-xl">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={[
                          "flex w-full items-center px-3 py-1.5 text-[12px] transition-colors hover:bg-muted text-left",
                          opt.value === sortBy
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* New application button */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("applicationsPage.newApplication", "New application")}
              </button>
            </div>
          </div>

          {view === "pipeline" ? (
            <div className="mt-3 flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                className={[
                  "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  !showArchived
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Активные
              </button>
              <button
                type="button"
                onClick={() => setShowArchived(true)}
                className={[
                  "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  showArchived
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Архив
              </button>
            </div>
          ) : null}

          {loopFilterId ? (
            <div className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[12.5px] text-primary">
              <span>Направление поиска: {loopFilter?.name ?? (isLoadingLoops ? "загружается…" : "Unknown loop")}</span>
              <button
                type="button"
                onClick={clearLoopFilter}
                className="rounded px-1.5 py-0.5 text-[11px] hover:bg-primary/10"
              >
                Сбросить
              </button>
            </div>
          ) : null}

          {/* View mode switcher — underline tab style */}
          <div className="flex items-center gap-0.5 mt-3 mb-0">
            {VIEW_MODES.map((vm) => {
              const isActive = view === vm.key;
              return (
                <button
                  key={vm.key}
                  type="button"
                  onClick={() => setView(vm.key)}
                  className={[
                    "-mb-px px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none",
                    "inline-flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "border-b-2 border-primary font-medium text-foreground"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {vm.label}
                  <span
                    className={[
                      "rounded-full border border-border bg-muted px-1.5 py-px text-[10.5px] tabular-nums",
                      isActive ? "text-foreground" : "text-muted-foreground/70",
                    ].join(" ")}
                  >
                    {viewCounts[vm.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <ApplicationsToolbar
            view={view}
            activeStatus={activeStatus}
            onChangeStatus={setActiveStatus}
            isLoading={isLoadingList}
            statusCounts={statusCounts}
            viewCount={list.length}
          />
        </div>
      </div>

      {/* Meta bar: between header and list */}
      <div className="flex items-center justify-between gap-3 px-7 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span>
            Показано <span className="font-semibold tabular-nums text-foreground">{filteredCount}</span> из {view === "pipeline" ? pageTotal : list.length}
          </span>
          {view === "pipeline" && pageTotal > 0 ? (
            <span className="text-[12px]">
              {pageOffset + 1}–{Math.min(pageOffset + pageLimit, pageTotal)} из {pageTotal}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {view === "pipeline" ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageOffset <= 0 || isLoadingList}
                onClick={goToPreviousPage}
                className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground disabled:opacity-40"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={pageOffset + pageLimit >= pageTotal || isLoadingList}
                onClick={goToNextPage}
                className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground disabled:opacity-40"
              >
                Вперёд
              </button>
            </div>
          ) : null}
          <ViewToggle value={displayMode} onChange={setDisplayMode} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex flex-col gap-3.5 p-7">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <ApplicationsListCard
            list={list}
            view={view}
            query={query}
            sortBy={sortBy}
            onChangeStatus={onChangeStatus}
            onToggleFavorite={onToggleFavorite}
            onArchiveApplication={showArchived ? undefined : onArchiveApplication}
            onRestoreApplication={showArchived ? onRestoreApplication : undefined}
            isArchivedView={showArchived}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            selectedCompanies={selectedCompanies}
            onFilteredCount={setFilteredCount}
            loopTitleById={loopTitleById}
          />
        </div>
      </div>

      {/* Create application dialog */}
      <CreateApplicationDialog
        isOpen={isCreateOpen}
        onClose={closeCreateDialog}
        form={form}
        onChange={updateForm}
        onCreate={onCreate}
        canSubmit={canSubmit}
        isCreating={isCreating}
        activeLoops={activeLoops}
        isLoadingLoops={isLoadingLoops}
        onSelectLoop={selectLoopById}
        initialLoopId={loopFilterId}
        initialMode={initialCreateMode}
        onCreateLoopRequested={() => {
          setIsCreateOpen(false);
          navigate(RoutePath[AppRoutes.LOOPS]);
        }}
      />
    </div>
  );
}
