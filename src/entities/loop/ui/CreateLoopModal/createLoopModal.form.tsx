import type { Dispatch, ReactNode, SetStateAction } from "react";

import { PLATFORM_LABEL_BY_ID, RECOMMENDED_PLATFORMS } from "../../model";
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
  function togglePlatform(id: string) {
    onFormChange((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  }

  return (
    <div className="space-y-4">
      <Field label="Название цикла" hint="Чтобы быстро узнать его в списке">
        <TextInput
          disabled={disabled}
          placeholder="Frontend EU"
          value={form.name}
          onChange={(v) => onFormChange((p) => ({ ...p, name: v }))}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Роль / должность">
          <TextInput
            disabled={disabled}
            placeholder="Frontend Engineer"
            value={form.role}
            onChange={(v) => onFormChange((p) => ({ ...p, role: v }))}
          />
        </Field>
        <Field label="Локация">
          <TextInput
            disabled={disabled}
            placeholder="Berlin"
            value={form.location}
            onChange={(v) => onFormChange((p) => ({ ...p, location: v }))}
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Источники
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDED_PLATFORMS.map((id) => {
            const label = PLATFORM_LABEL_BY_ID[id] ?? id;
            const active = form.platforms.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => togglePlatform(id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors",
                  "border disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground",
                ].join(" ")}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/40"}`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onCreate}
          className="rounded-lg bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "Создание…" : "Создать и запустить"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      {children}
      {hint ? (
        <div className="mt-1 text-[11px] text-muted-foreground/70">{hint}</div>
      ) : null}
    </label>
  );
}

function TextInput({
  disabled,
  onChange,
  placeholder,
  value,
  autoFocus,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-[7px] border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
