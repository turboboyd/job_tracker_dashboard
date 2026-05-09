import type { ChangeEvent } from "react";

import { FormField, Input, TextArea } from "src/shared/ui";

import type {
  CreateApplicationChangeHandler,
  CreateFormFieldKey,
} from "./CreateApplicationCard.types";

interface TextInputFieldProps {
  field: CreateFormFieldKey;
  label: string;
  onChange: CreateApplicationChangeHandler;
  placeholder: string;
  required?: boolean;
  spanFull?: boolean;
  value: string;
}

interface TextAreaFieldProps {
  label: string;
  onChange: CreateApplicationChangeHandler;
  placeholder: string;
  value: string;
}

export function CreateApplicationTextInputField({
  field,
  label,
  onChange,
  placeholder,
  required,
  spanFull,
  value,
}: TextInputFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(field, event.target.value);
  }

  const fieldProps = required ? { label, required } : { label };

  const content = (
    <FormField {...fieldProps}>
      {(props) => (
        <Input
          id={props.id}
          aria-describedby={props.describedBy}
          aria-invalid={props.invalid}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
      )}
    </FormField>
  );

  return spanFull ? <div className="md:col-span-2">{content}</div> : content;
}

export function CreateApplicationTextAreaField({
  label,
  onChange,
  placeholder,
  value,
}: TextAreaFieldProps) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange("rawDescription", event.target.value);
  }

  return (
    <div className="md:col-span-2">
      <FormField label={label}>
        {(props) => (
          <TextArea
            id={props.id}
            aria-describedby={props.describedBy}
            aria-invalid={props.invalid}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
        )}
      </FormField>
    </div>
  );
}
