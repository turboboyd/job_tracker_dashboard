import React, { useMemo, useState } from "react";

import { getErrorMessage } from "src/shared/lib";
import { Modal } from "src/shared/ui";

import { useCreateLoopMutation } from "../../api/loopApi";

import { CreateLoopFormFields } from "./createLoopModal.form";
import {
  buildCreateLoopInput,
  createInitialLoopForm,
  validateCreateLoopForm,
} from "./createLoopModal.helpers";
import type { CreateLoopForm, CreateLoopModalProps } from "./createLoopModal.types";

export function CreateLoopModal({
  open,
  onOpenChange,
  onCreated,
}: CreateLoopModalProps) {
  const [createLoop, st] = useCreateLoopMutation();
  const initial = useMemo<CreateLoopForm>(() => createInitialLoopForm(), []);
  const [form, setForm] = useState<CreateLoopForm>(initial);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setError(null);
    }
  }, [open, initial]);

  const disabled = st.isLoading;

  async function onCreate() {
    setError(null);

    const validationError = validateCreateLoopForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await createLoop(buildCreateLoopInput(form)).unwrap();

      onOpenChange(false);
      onCreated(res.id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create loop"
      description="Start with the basics: name, role, location. You can fine-tune in My Loop settings later."
    >
      {error ? (
        <div className="mb-3 rounded-xl border border-border bg-background p-3 text-sm">
          {error}
        </div>
      ) : null}

      <CreateLoopFormFields
        disabled={disabled}
        form={form}
        onCancel={() => onOpenChange(false)}
        onCreate={onCreate}
        onFormChange={setForm}
      />
    </Modal>
  );
}
