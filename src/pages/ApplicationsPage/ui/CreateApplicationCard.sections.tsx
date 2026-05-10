import { Button } from "src/shared/ui";

import type { CreateFormState } from "../model/types";

import {
  CreateApplicationTextAreaField,
  CreateApplicationTextInputField,
} from "./CreateApplicationCard.fields";
import type {
  CreateApplicationChangeHandler,
  CreateApplicationLabels,
} from "./CreateApplicationCard.types";

export type {
  CreateApplicationChangeHandler,
  CreateApplicationLabels,
} from "./CreateApplicationCard.types";

interface CreateApplicationCardLayoutProps {
  canSubmit: boolean;
  form: CreateFormState;
  isCreating: boolean;
  labels: CreateApplicationLabels;
  onChange: CreateApplicationChangeHandler;
  onCreate: () => void;
}

export function CreateApplicationCardLayout({
  canSubmit,
  form,
  isCreating,
  labels,
  onChange,
  onCreate,
}: CreateApplicationCardLayoutProps) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-3 text-lg font-semibold">{labels.title}</div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CreateApplicationTextInputField
          field="companyName"
          label={labels.company}
          value={form.companyName}
          onChange={onChange}
          placeholder={labels.companyPlaceholder}
          required
        />

        <CreateApplicationTextInputField
          field="roleTitle"
          label={labels.role}
          value={form.roleTitle}
          onChange={onChange}
          placeholder={labels.rolePlaceholder}
          required
        />

        <CreateApplicationTextInputField
          field="vacancyUrl"
          label={labels.url}
          value={form.vacancyUrl}
          onChange={onChange}
          placeholder={labels.urlPlaceholder}
          spanFull
        />

        <CreateApplicationTextInputField
          field="source"
          label={labels.source}
          value={form.source}
          onChange={onChange}
          placeholder={labels.sourcePlaceholder}
        />

        <CreateApplicationTextAreaField
          label={labels.description}
          value={form.rawDescription}
          onChange={onChange}
          placeholder={labels.descriptionPlaceholder}
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button onClick={onCreate} disabled={!canSubmit || isCreating}>
          {isCreating ? labels.creatingButton : labels.createButton}
        </Button>
      </div>
    </div>
  );
}
