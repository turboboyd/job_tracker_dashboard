import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { PLATFORM_LABEL_BY_ID, RECOMMENDED_PLATFORMS } from "../../model";
import type { CanonicalFilters } from "../../model";

import type { CreateLoopForm } from "./createLoopModal.types";

interface CreateLoopFormFieldsProps {
  disabled: boolean;
  form: CreateLoopForm;
  onCancel: () => void;
  onCreate: () => void;
  onFormChange: Dispatch<SetStateAction<CreateLoopForm>>;
}

const WORK_MODE_OPTIONS: { value: CanonicalFilters["workMode"]; label: string }[] = [
  { value: "any", label: "Любой формат" },
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
  { value: "onsite", label: "В офисе" },
];

export function CreateLoopFormFields({
  disabled,
  form,
  onCancel,
  onCreate,
  onFormChange,
}: CreateLoopFormFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function togglePlatform(id: string) {
    onFormChange((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  }

  return (
    <div className="space-y-5">
      {/* ── Основное ── */}
      <section className="space-y-3">
        <SectionTitle>Основное</SectionTitle>
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Радиус поиска, км">
            <TextInput
              disabled={disabled}
              placeholder="30"
              inputMode="numeric"
              value={form.radiusKm}
              onChange={(v) => onFormChange((p) => ({ ...p, radiusKm: v }))}
            />
          </Field>
          <Field label="Формат работы">
            <select
              disabled={disabled}
              value={form.workMode}
              onChange={(e) =>
                onFormChange((p) => ({
                  ...p,
                  workMode: e.target.value as CanonicalFilters["workMode"],
                }))
              }
              className="h-9 w-full rounded-[7px] border border-border bg-background px-2.5 text-[13px] text-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {WORK_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* ── Источники ── */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <SectionTitle>Источники</SectionTitle>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            Выбрано: {form.platforms.length}
          </span>
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
                aria-pressed={active}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  "border disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={`text-[11px] leading-none ${active ? "text-primary" : "text-muted-foreground/50"}`}
                >
                  {active ? "✓" : "+"}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Расширенные фильтры (collapsed by default) ── */}
      <section className="rounded-[10px] border border-border bg-background/50">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        >
          <span className="text-[12.5px] font-medium text-foreground">
            Расширенные фильтры
          </span>
          <span className="text-[11px] text-muted-foreground">
            {advancedOpen ? "Скрыть" : "Показать"}
          </span>
        </button>
        {advancedOpen ? (
          <div className="space-y-3 border-t border-border px-3.5 pb-3.5 pt-3">
            <Field
              label="Ключевые слова"
              hint="Через запятую — попадут в поисковый запрос"
            >
              <TextInput
                disabled={disabled}
                placeholder="react, typescript"
                value={form.includeKeywords}
                onChange={(v) => onFormChange((p) => ({ ...p, includeKeywords: v }))}
              />
            </Field>
            <Field
              label="Исключить слова"
              hint="Вакансии с этими словами будут отфильтрованы"
            >
              <TextInput
                disabled={disabled}
                placeholder="senior, lead"
                value={form.excludeKeywords}
                onChange={(v) => onFormChange((p) => ({ ...p, excludeKeywords: v }))}
              />
            </Field>
          </div>
        ) : null}
      </section>

      {/* ── Действия ── */}
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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
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
  inputMode,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  autoFocus?: boolean;
  inputMode?: "numeric";
}) {
  return (
    <input
      type="text"
      autoFocus={autoFocus}
      inputMode={inputMode}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-[7px] border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
