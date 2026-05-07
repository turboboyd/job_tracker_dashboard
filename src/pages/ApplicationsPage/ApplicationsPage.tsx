import { Filter, Plus } from "lucide-react";
import React, { useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth/model/hooks/useAuthSelectors";
import { db } from "src/shared/config/firebase/firebase";

import { createApplicationsRepo } from "./api/applicationsRepo";
import { useApplicationsPage } from "./model/useApplicationsPage";
import { ApplicationsListCard } from "./ui/ApplicationsListCard";
import { ApplicationsToolbar } from "./ui/ApplicationsToolbar";
import { CreateApplicationCard } from "./ui/CreateApplicationCard";


export default function ApplicationsPage() {
  const { t } = useTranslation();
  const { userId, isAuthReady } = useAuthSelectors();
  const repo = useMemo(() => createApplicationsRepo(db), []);
  const createCardRef = useRef<HTMLDivElement>(null);

  const {
    view,
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
  } = useApplicationsPage({ userId, isAuthReady, repo });

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
            </div>

            <div className="flex items-center gap-2 pb-3">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Filter className="h-3.5 w-3.5 text-subtle-foreground" />
                {t("applicationsPage.filters", "Filters")}
              </button>
              <button
                type="button"
                onClick={() => createCardRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("applicationsPage.newApplication", "New application")}
              </button>
            </div>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex flex-col gap-3.5 p-7">
          <div ref={createCardRef}>
            <CreateApplicationCard
              form={form}
              onChange={updateForm}
              onCreate={onCreate}
              canSubmit={canSubmit}
              isCreating={isCreating}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <ApplicationsListCard list={list} view={view} />
        </div>
      </div>
    </div>
  );
}
