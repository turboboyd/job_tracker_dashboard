import React from "react";

import { Button, InputField, TextAreaField } from "src/shared/ui";

import type {
  EditMatchModalFormValues,
  EditMatchModalLabels,
} from "./editMatchModal.helpers";

const FULL_WIDTH_FIELD_CLASS = "md:col-span-2";

interface EditMatchModalContentProps {
  disabled: boolean;
  labels: EditMatchModalLabels;
  onChange: (field: keyof EditMatchModalFormValues, value: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  values: EditMatchModalFormValues;
}

export function EditMatchModalContent({
  disabled,
  labels,
  onChange,
  onClose,
  onSave,
  values,
}: EditMatchModalContentProps) {
  const createInputChangeHandler =
    (field: keyof EditMatchModalFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(field, event.target.value);
    };

  const createTextAreaChangeHandler =
    (field: keyof EditMatchModalFormValues) =>
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(field, event.target.value);
    };

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        <div className={FULL_WIDTH_FIELD_CLASS}>
          <InputField
            label={labels.titleField}
            value={values.title}
            onChange={createInputChangeHandler("title")}
            disabled={disabled}
          />
        </div>

        <InputField
          label={labels.company}
          value={values.company}
          onChange={createInputChangeHandler("company")}
          disabled={disabled}
        />

        <InputField
          label={labels.location}
          value={values.location}
          onChange={createInputChangeHandler("location")}
          disabled={disabled}
        />

        <InputField
          label={labels.url}
          value={values.url}
          onChange={createInputChangeHandler("url")}
          disabled={disabled}
        />

        <InputField
          label={labels.matchedAt}
          type="date"
          value={values.matchedAt}
          onChange={createInputChangeHandler("matchedAt")}
          disabled={disabled}
        />

        <div className={FULL_WIDTH_FIELD_CLASS}>
          <TextAreaField
            label={labels.description}
            value={values.description}
            onChange={createTextAreaChangeHandler("description")}
            disabled={disabled}
            rows={6}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-sm border-t border-border pt-md">
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          shadow="sm"
          disabled={disabled}
          onClick={onClose}
        >
          {labels.cancel}
        </Button>

        <Button
          variant="default"
          size="sm"
          shape="pill"
          shadow="sm"
          disabled={disabled}
          onClick={() => {
            onSave().catch(() => undefined);
          }}
        >
          {labels.save}
        </Button>
      </div>
    </div>
  );
}
