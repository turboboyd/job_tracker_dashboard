import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CONTACT_ROLE_KEYS, type ContactRole } from "src/entities/contact";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import { db } from "src/shared/config/firebase/firestore";

import { useApplicationsPage } from "./model/useApplicationsPage";
import { ApplicationsListCard } from "./ui/ApplicationsListCard";
import { ApplicationsPageHeader } from "./ui/ApplicationsPageHeader";
import { ApplicationsToolbar } from "./ui/ApplicationsToolbar";
import {
  NewApplicationModal,
  type ContactSectionLabels,
} from "./ui/NewApplicationModal";
import type { CreateApplicationLabels } from "./ui/CreateApplicationCard.types";

export default function ApplicationsPage() {
  const { t } = useTranslation();
  const { userId, isAuthReady } = useAuthSelectors();
  const repo = useMemo(() => createApplicationsRepo(db), []);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const labels: CreateApplicationLabels = useMemo(() => {
    const text = (key: string, defaultValue: string) =>
      String(t(key, { defaultValue, returnObjects: false }));
    return {
      company: text("applicationsPage.create.company", "Company"),
      companyPlaceholder: text("applicationsPage.create.companyPh", "e.g. ACME GmbH"),
      createButton: text("applicationsPage.create.createBtn", "Create"),
      creatingButton: text("applicationsPage.create.creating", "Creating..."),
      description: text("applicationsPage.create.desc", "Description (optional)"),
      descriptionPlaceholder: text(
        "applicationsPage.create.descPh",
        "Paste vacancy text to improve matching...",
      ),
      role: text("applicationsPage.create.role", "Role"),
      rolePlaceholder: text("applicationsPage.create.rolePh", "e.g. Frontend Developer"),
      source: text("applicationsPage.create.source", "Source"),
      sourcePlaceholder: text(
        "applicationsPage.create.sourcePh",
        "LinkedIn / Indeed / Company site",
      ),
      title: text("applicationsPage.create.title", "New application"),
      url: text("applicationsPage.create.url", "Vacancy URL"),
      urlPlaceholder: text("applicationsPage.create.urlPh", "https://..."),
    };
  }, [t]);

  const contactLabels: ContactSectionLabels = useMemo(() => {
    const text = (key: string, defaultValue: string) =>
      String(t(key, { defaultValue, returnObjects: false }));
    const roleLabels = CONTACT_ROLE_KEYS.reduce<Record<ContactRole, string>>(
      (acc, role) => {
        acc[role] = text(`applicationsPage.create.contactRole.${role}`, role);
        return acc;
      },
      {} as Record<ContactRole, string>,
    );
    return {
      sectionTitle: text("applicationsPage.create.contact.title", "Primary contact (optional)"),
      sectionHint: text(
        "applicationsPage.create.contact.hint",
        "Add it now or later from the application page.",
      ),
      firstName: text("applicationsPage.create.contact.firstName", "First name"),
      firstNamePh: text("applicationsPage.create.contact.firstNamePh", "Anna"),
      lastName: text("applicationsPage.create.contact.lastName", "Last name"),
      lastNamePh: text("applicationsPage.create.contact.lastNamePh", "Petrova"),
      role: text("applicationsPage.create.contact.role", "Role"),
      phone: text("applicationsPage.create.contact.phone", "Phone"),
      phonePh: text("applicationsPage.create.contact.phonePh", "+49 ..."),
      email: text("applicationsPage.create.contact.email", "Email"),
      emailPh: text("applicationsPage.create.contact.emailPh", "name@company.com"),
      cancel: text("applicationsPage.create.cancel", "Cancel"),
      roleLabels,
    };
  }, [t]);

  return (
    <div className="w-full p-4">
      <ApplicationsPageHeader
        view={view}
        onChangeView={setView}
        onNewApplication={() => setIsModalOpen(true)}
      />

      <div className="mt-4 space-y-4">
        <ApplicationsToolbar
          view={view}
          activeStatus={activeStatus}
          onChangeStatus={setActiveStatus}
          isLoading={isLoadingList}
          count={list.length}
        />

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <ApplicationsListCard list={list} view={view} />
      </div>

      <NewApplicationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        form={form}
        onChange={updateForm}
        onCreate={onCreate}
        canSubmit={canSubmit}
        isCreating={isCreating}
        labels={labels}
        contactLabels={contactLabels}
      />
    </div>
  );
}
