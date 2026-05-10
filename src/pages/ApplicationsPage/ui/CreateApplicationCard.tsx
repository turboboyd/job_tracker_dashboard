import { useTranslation } from "react-i18next";

import type { CreateFormState } from "../model/types";

import {
  CreateApplicationCardLayout,
  type CreateApplicationChangeHandler,
  type CreateApplicationLabels,
} from "./CreateApplicationCard.sections";

interface CreateApplicationCardProps {
  canSubmit: boolean;
  form: CreateFormState;
  isCreating: boolean;
  onChange: CreateApplicationChangeHandler;
  onCreate: () => void;
}

export function CreateApplicationCard(props: CreateApplicationCardProps) {
  const { t } = useTranslation();

  return <CreateApplicationCardLayout {...props} labels={buildLabels(t)} />;
}

function buildLabels(
  t: ReturnType<typeof useTranslation>["t"],
): CreateApplicationLabels {
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
}
