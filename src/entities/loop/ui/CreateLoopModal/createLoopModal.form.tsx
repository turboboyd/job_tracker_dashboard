import type { Dispatch, SetStateAction } from "react";

import { Button, Input } from "src/shared/ui";

import type { CreateLoopForm } from "./createLoopModal.types";

interface CreateLoopFormFieldsProps {
  disabled: boolean;
  form: CreateLoopForm;
  onCancel: () => void;
  onCreate: () => void;
  onFormChange: Dispatch<SetStateAction<CreateLoopForm>>;
}

export function CreateLoopFormFields({
  disabled,
  form,
  onCancel,
  onCreate,
  onFormChange,
}: CreateLoopFormFieldsProps) {
  return (
    <div className="space-y-3">
      <LoopTextField
        disabled={disabled}
        label="Loop name"
        onChange={(name) => onFormChange((p) => ({ ...p, name }))}
        placeholder="New loop"
        value={form.name}
      />

      <LoopTextField
        disabled={disabled}
        label="Position / Role"
        onChange={(role) => onFormChange((p) => ({ ...p, role }))}
        placeholder="e.g. Fachinformatiker Anwendungsentwicklung"
        value={form.role}
      />

      <LoopTextField
        disabled={disabled}
        label="City / Location"
        onChange={(location) => onFormChange((p) => ({ ...p, location }))}
        placeholder="Berlin"
        value={form.location}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          shadow="sm"
          shape="lg"
          disabled={disabled}
          onClick={onCreate}
        >
          {disabled ? "Creating..." : "Create"}
        </Button>

        <Button
          variant="outline"
          shape="lg"
          disabled={disabled}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function LoopTextField({
  disabled,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 text-sm text-muted-foreground">{label}</div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
