import { ChevronDown, Plus, Search } from "lucide-react";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth/model/hooks/useAuthSelectors";
import { db } from "src/shared/config/firebase/firebase";

import { createApplicationsRepo } from "./api/applicationsRepo";
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

export default function ApplicationsPage() {
  const { t } = useTranslation();
  const { userId, isAuthReady } = useAuthSelectors();
  const repo = useMemo(() => createApplicationsRepo(db), []);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"list" | "cards">("list");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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

    list,
    isLoadingList,
    error,

    onChangeStatus,
  } = useApplicationsPage({ userId, isAuthReady, repo });

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

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  const VIEW_MODES = [
    { key: "pipeline" as const, label: t("applicationsPage.view.pipeline", "Pipeline") },
    { key: "today" as const, label: t("applicationsPage.view.today", "Today") },
    { key: "followups" as const, label: t("applicationsPage.view.followups", "Follow-ups") },
  ];

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
                </button>
              );
            })}
          </div>

          <ApplicationsToolbar
            view={view}
            activeStatus={activeStatus}
            onChangeStatus={setActiveStatus}
            isLoading={isLoadingList}
            count={list.length}
          />
        </div>
      </div>

      {/* Meta bar: between header and list */}
      <div className="flex items-center justify-between gap-3 px-7 py-3 border-b border-border bg-background shrink-0">
        <span className="text-[13px] text-muted-foreground">
          Показано <span className="font-semibold tabular-nums text-foreground">{list.length}</span> из {list.length}
        </span>
        <ViewToggle value={displayMode} onChange={setDisplayMode} />
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
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
          />
        </div>
      </div>

      {/* Create application dialog */}
      <CreateApplicationDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        form={form}
        onChange={updateForm}
        onCreate={onCreate}
        canSubmit={canSubmit}
        isCreating={isCreating}
      />
    </div>
  );
}
