import { useField } from 'formik';
import React from 'react';

import { FormField } from './FormField/FormField';
import { InputField, type InputFieldProps } from './Input';
import { SelectField, type SelectFieldProps } from './Select';
import { TextAreaField, type TextAreaFieldProps } from './TextArea/TextAreaField';

export function FormikTextField({
  name,
  ...props
}: Omit<InputFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
  name: string;
}) {
  const [field, meta] = useField<string>(name);

  return (
    <InputField
      {...props}
      name={name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched ? meta.error : undefined}
    />
  );
}

export function FormikTextareaField({
  name,
  ...props
}: Omit<TextAreaFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
  name: string;
}) {
  const [field, meta] = useField<string>(name);

  return (
    <TextAreaField
      {...props}
      name={name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched ? meta.error : undefined}
    />
  );
}

export function FormikSelectField<V extends string>({
  name,
  ...props
}: Omit<SelectFieldProps<V>, 'name' | 'value' | 'onChange' | 'error'> & {
  name: string;
}) {
  const [field, meta, helpers] = useField<V>(name);

  return (
    <SelectField<V>
      {...props}
      value={field.value}
      onChange={(next: V) => {
        helpers.setValue(next).catch(() => undefined);
      }}
      onBlur={field.onBlur}
      error={meta.touched ? meta.error : undefined}
    />
  );
}

interface FormikCheckboxFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value' | 'checked'> {
  name: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
}

export function FormikCheckboxField({
  name,
  label,
  hint,
  disabled,
  ...props
}: FormikCheckboxFieldProps) {
  const [field, meta] = useField<boolean>({ name, type: 'checkbox' });
  const fieldProps = {
    name: field.name,
    onBlur: field.onBlur,
    onChange: field.onChange,
  };

  return (
    <FormField
      label={label}
      hint={hint}
      error={meta.touched ? meta.error : undefined}
      htmlFor={name}
    >
      {({
        id,
        describedBy,
        invalid,
      }: {
        id: string;
        describedBy: string | undefined;
        invalid: boolean;
      }) => (
        <label
          htmlFor={id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <input
            {...fieldProps}
            {...props}
            id={id}
            type="checkbox"
            checked={Boolean(field.value)}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="min-w-0 flex-1">{label}</span>
        </label>
      )}
    </FormField>
  );
}
