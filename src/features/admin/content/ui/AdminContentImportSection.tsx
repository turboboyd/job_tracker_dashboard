import { Form, Formik } from "formik";

import { SectionCard } from "src/shared/ui/system";

import { buildImportItems, type ImportFormValues } from "../lib/adminContentHelpers";

import {
  IMPORT_SECTION_DESCRIPTION,
  INITIAL_VALUES,
} from "./adminContentImport.constants";
import {
  getFailureToastDescription,
  getSuccessToastDescription,
  getSuccessToastTitle,
} from "./adminContentImport.feedback";
import {
  ImportFormFields,
  ImportRowsField,
  ImportSubmitActions,
  UnsavedImportDraftMarker,
} from "./adminContentImport.form";
import { ImportResultPanel } from "./adminContentImport.results";
import type { AdminContentImportSectionProps } from "./adminContentImport.types";
import { IMPORT_SCHEMA } from "./adminContentImport.validation";

export function AdminContentImportSection({
  lastImportResult,
  isLoading,
  onImportResult,
  onToast,
  onSubmitImport,
}: AdminContentImportSectionProps) {
  return (
    <SectionCard title="Bulk import" description={IMPORT_SECTION_DESCRIPTION}>
      <Formik<ImportFormValues>
        initialValues={INITIAL_VALUES}
        validationSchema={IMPORT_SCHEMA}
        onSubmit={async (values, helpers) => {
          try {
            const result = await onSubmitImport({
              items: buildImportItems(values),
              dryRun: values.dryRun,
            });

            onImportResult(result);
            onToast({
              title: getSuccessToastTitle(values.dryRun),
              description: getSuccessToastDescription(result),
              tone: "success",
            });

            if (!values.dryRun) {
              helpers.resetForm();
            }
          } catch (error: unknown) {
            onToast({
              title: "Import failed",
              description: getFailureToastDescription(error),
              tone: "error",
            });
          }
        }}
      >
        {({ dirty, isSubmitting, values }) => (
          <Form className="space-y-5">
            <UnsavedImportDraftMarker dirty={dirty} />
            <ImportFormFields />
            <ImportRowsField />
            <ImportSubmitActions
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              isDryRun={values.dryRun}
            />
            {lastImportResult ? (
              <ImportResultPanel result={lastImportResult} />
            ) : null}
          </Form>
        )}
      </Formik>
    </SectionCard>
  );
}

