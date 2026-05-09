import type { ReactNode } from "react";

import type { LoadState, TextTarget } from "./cvChecker.helpers";
import type { CvCheckerText } from "./cvChecker.text";

export const AREA_CLASS =
  "mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const MUTED_PANEL_CLASS = "rounded-lg border border-border bg-muted/30 p-3";
const TAG_CLASS = "rounded-full border border-border bg-card px-2 py-1 text-xs";
const DANGER_TAG_CLASS =
  "rounded-full border border-border bg-destructive/5 px-2 py-1 text-xs";
export const METRIC_CARD_CLASS = "rounded-lg border border-border bg-muted/40 p-3";

export function SectionTitle({ children }: { children: string }) {
  return <div className="text-sm font-medium text-foreground">{children}</div>;
}

export function SectionHint({ children }: { children: string }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}

export function FieldLength({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="mt-2 text-xs text-muted-foreground">
      {label}: <b>{value}</b>
    </div>
  );
}

export function UploadPdfLabel({
  isLoading,
  onPickPdf,
  target,
  text,
}: {
  isLoading: boolean;
  onPickPdf: (which: TextTarget, file: File | null) => Promise<void>;
  target: TextTarget;
  text: CvCheckerText;
}) {
  return (
    <label className="cursor-pointer text-xs font-medium text-foreground underline">
      {isLoading ? text.loadingPdf : text.uploadPdf}
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          void onPickPdf(target, event.target.files?.[0] ?? null);
        }}
      />
    </label>
  );
}

export function EditorArea({
  heightClassName,
  onChange,
  placeholder,
  value,
}: {
  heightClassName: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <textarea
      className={`${AREA_CLASS} ${heightClassName}`}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function ResultTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <span className={tone === "danger" ? DANGER_TAG_CLASS : TAG_CLASS}>
      {children}
    </span>
  );
}

export function EmptyValue({ text }: { text: string }) {
  return <span className="text-sm text-muted-foreground">{text}</span>;
}

export function ResultGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ScheduleStateMessage({ state }: { state: LoadState }) {
  if (state.kind === "error") {
    return (
      <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
        <b>Ошибка:</b> {state.message}
      </div>
    );
  }

  if (state.kind === "info") {
    return (
      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
        {state.message}
      </div>
    );
  }

  return null;
}
