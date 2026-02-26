import React, { useMemo } from "react";

import { useAuthSelectors } from "src/entities/auth/model/hooks/useAuthSelectors";
import { db } from "src/shared/config/firebase/firebase";

import { createApplicationsRepo } from "./api/applicationsRepo";
import { useApplicationsPage } from "./model/useApplicationsPage";
import { ApplicationsListCard } from "./ui/ApplicationsListCard";
import { ApplicationsPageHeader } from "./ui/ApplicationsPageHeader";
import { ApplicationsToolbar } from "./ui/ApplicationsToolbar";
import { CreateApplicationCard } from "./ui/CreateApplicationCard";


export default function ApplicationsPage() {
  const { userId, isAuthReady } = useAuthSelectors();
  const repo = useMemo(() => createApplicationsRepo(db), []);

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
  } = useApplicationsPage({ userId, isAuthReady, repo });

  return (
    <div className="w-full p-4">
      <ApplicationsPageHeader view={view} onChangeView={setView} />

      <div className="mt-4 space-y-4">
        <ApplicationsToolbar
          view={view}
          activeStatus={activeStatus}
          onChangeStatus={setActiveStatus}
          isLoading={isLoadingList}
          count={list.length}
        />

        <CreateApplicationCard
          form={form}
          onChange={updateForm}
          onCreate={onCreate}
          canSubmit={canSubmit}
          isCreating={isCreating}
        />

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <ApplicationsListCard list={list} view={view} />
      </div>
    </div>
  );
}
