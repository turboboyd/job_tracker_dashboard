import { Button } from "src/shared/ui/Button";
import {
  FormikCheckboxField,
  FormikSelectField,
  FormikTextField,
  FormikTextareaField,
} from "src/shared/ui/Form";

import {
  DRY_RUN_HINT,
  LEVEL_SELECT_OPTIONS,
  TSV_PLACEHOLDER,
  UNSAVED_DRAFT_MESSAGE,
} from "./adminContentImport.constants";
import { getSubmitButtonLabel } from "./adminContentImport.feedback";

export function ImportFormFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <FormikTextField name="language" label="Language" />
      <FormikTextField name="nativeLanguage" label="Native language" />
      <FormikSelectField
        name="level"
        label="Level"
        options={LEVEL_SELECT_OPTIONS}
      />
      <FormikTextField name="stage" label="Stage" />
      <FormikTextField name="topic" label="Topic" />
      <div>
        <FormikCheckboxField
          name="dryRun"
          label="Dry-run only"
          hint={DRY_RUN_HINT}
        />
      </div>
    </div>
  );
}

export function ImportRowsField() {
  return (
    <FormikTextareaField
      name="rowsText"
      label="TSV rows"
      rows={12}
      placeholder={TSV_PLACEHOLDER}
    />
  );
}

export function ImportSubmitActions({
  isLoading,
  isSubmitting,
  isDryRun,
}: {
  isLoading: boolean;
  isSubmitting: boolean;
  isDryRun: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={isSubmitting || isLoading}>
        {getSubmitButtonLabel(isLoading, isDryRun)}
      </Button>
    </div>
  );
}

export function UnsavedImportDraftMarker({ dirty }: { dirty: boolean }) {
  if (!dirty) {
    return null;
  }

  return (
    <div
      style={{ display: "none" }}
      aria-hidden
      data-unsaved-message={UNSAVED_DRAFT_MESSAGE}
    />
  );
}
