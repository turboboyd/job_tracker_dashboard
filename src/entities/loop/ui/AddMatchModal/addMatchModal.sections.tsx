import type { FormikProps } from "formik";
import type { MutableRefObject } from "react";

import { Button, InlineError } from "src/shared/ui";

import {
  AddMatchDescriptionField,
  AddMatchPlatformField,
  AddMatchStatusField,
  AddMatchTextInputField,
  AddMatchUrlField,
} from "./addMatchModal.fields";
import type {
  AddMatchFormValues,
  AddMatchModalLabels,
  AddMatchSelectOption,
  AddMatchTextFieldConfig,
} from "./addMatchModal.helpers";

interface AddMatchFormFieldsProps {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  labels: AddMatchModalLabels;
  platformManuallySetRef: MutableRefObject<boolean>;
  platformOptions: AddMatchSelectOption<AddMatchFormValues["platform"]>[];
  statusOptions: AddMatchSelectOption<AddMatchFormValues["status"]>[];
  textFieldConfigs: AddMatchTextFieldConfig[];
}

export function AddMatchFormFields({
  disabled,
  formik,
  labels,
  platformManuallySetRef,
  platformOptions,
  statusOptions,
  textFieldConfigs,
}: AddMatchFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {textFieldConfigs.map((config) => (
        <AddMatchTextInputField
          key={config.name}
          config={config}
          disabled={disabled}
          formik={formik}
        />
      ))}

      <AddMatchPlatformField
        disabled={disabled}
        formik={formik}
        label={labels.platform}
        onManualPlatformSelect={() => {
          platformManuallySetRef.current = true;
        }}
        options={platformOptions}
      />

      <AddMatchUrlField
        disabled={disabled}
        formik={formik}
        labels={labels}
        platformManuallySetRef={platformManuallySetRef}
      />

      <AddMatchStatusField
        disabled={disabled}
        formik={formik}
        label={labels.status}
        options={statusOptions}
      />
    </div>
  );
}

interface AddMatchActionsProps {
  canSubmit: boolean;
  disabled: boolean;
  labels: AddMatchModalLabels;
  onCancel: () => void;
}

export function AddMatchActions({
  canSubmit,
  disabled,
  labels,
  onCancel,
}: AddMatchActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="submit"
        variant="default"
        shadow="sm"
        shape="lg"
        disabled={!canSubmit}
      >
        {disabled ? labels.saving : labels.saveMatch}
      </Button>

      <Button
        type="button"
        variant="outline"
        shape="lg"
        onClick={onCancel}
        disabled={disabled}
      >
        {labels.cancel}
      </Button>
    </div>
  );
}

interface AddMatchFormContentProps {
  commonError: string | undefined;
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  labels: AddMatchModalLabels;
  onCancel: () => void;
  platformManuallySetRef: MutableRefObject<boolean>;
  platformOptions: AddMatchSelectOption<AddMatchFormValues["platform"]>[];
  statusOptions: AddMatchSelectOption<AddMatchFormValues["status"]>[];
  textFieldConfigs: AddMatchTextFieldConfig[];
}

export function AddMatchFormContent({
  commonError,
  disabled,
  formik,
  labels,
  onCancel,
  platformManuallySetRef,
  platformOptions,
  statusOptions,
  textFieldConfigs,
}: AddMatchFormContentProps) {
  const canSubmit = !disabled && formik.dirty;

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {commonError ? <InlineError message={commonError} /> : null}

      <AddMatchFormFields
        disabled={disabled}
        formik={formik}
        labels={labels}
        platformManuallySetRef={platformManuallySetRef}
        platformOptions={platformOptions}
        statusOptions={statusOptions}
        textFieldConfigs={textFieldConfigs}
      />

      <AddMatchDescriptionField
        disabled={disabled}
        formik={formik}
        labels={labels}
      />

      <AddMatchActions
        canSubmit={canSubmit}
        disabled={disabled}
        labels={labels}
        onCancel={onCancel}
      />
    </form>
  );
}
