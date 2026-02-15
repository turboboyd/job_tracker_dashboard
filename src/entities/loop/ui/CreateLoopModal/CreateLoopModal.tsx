import React, { useMemo, useState } from "react";

import { getErrorMessage } from "src/shared/lib";
import { Button, Input, Modal } from "src/shared/ui";

import { useCreateLoopMutation } from "../../api/loopApi";
import {
  DEFAULT_CANONICAL_FILTERS,
  RECOMMENDED_PLATFORMS,
  normalizeRoleToTitles,
} from "../../model";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (loopId: string) => void;
};

type CreateLoopForm = {
  name: string;
  role: string;
  location: string;
};

function validate(form: CreateLoopForm): string | null {
  const name = form.name.trim();
  const role = form.role.trim();
  const location = form.location.trim();

  if (!name) return "Name is required";
  if (name.length < 2) return "Name is too short";
  if (name.length > 60) return "Name is too long";

  if (!role) return "Position / Role is required";
  if (role.length < 2) return "Role is too short";
  if (role.length > 120) return "Role is too long";

  if (!location) return "City / Location is required";
  if (location.length > 80) return "Location is too long";

  return null;
}

export function CreateLoopModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [createLoop, st] = useCreateLoopMutation();

  const initial = useMemo<CreateLoopForm>(
    () => ({ name: "My Loop", role: "", location: "Berlin" }),
    [],
  );

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

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const name = form.name.trim();
    const role = form.role.trim();
    const location = form.location.trim();

    try {
      const res = await createLoop({
        name,
        titles: normalizeRoleToTitles(role),
        location,
        radiusKm: 30,
        remoteMode: "any",
        platforms: RECOMMENDED_PLATFORMS,
        filters: {
          ...DEFAULT_CANONICAL_FILTERS,
          role,
          location,
          radiusKm: 30,
          workMode: "any",
        },
      }).unwrap();

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

      <div className="space-y-3">
        <div>
          <div className="mb-1 text-sm text-muted-foreground">Loop name</div>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="My Loop"
            disabled={disabled}
          />
        </div>

        <div>
          <div className="mb-1 text-sm text-muted-foreground">
            Position / Role
          </div>
          <Input
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            placeholder="e.g. Fachinformatiker Anwendungsentwicklung"
            disabled={disabled}
          />
        </div>

        <div>
          <div className="mb-1 text-sm text-muted-foreground">
            City / Location
          </div>
          <Input
            value={form.location}
            onChange={(e) =>
              setForm((p) => ({ ...p, location: e.target.value }))
            }
            placeholder="Berlin"
            disabled={disabled}
          />
        </div>

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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
