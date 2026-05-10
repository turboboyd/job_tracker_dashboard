import type { ChangeEvent, ReactNode } from "react";

import { Input } from "src/shared/ui";

import { formatBytes, type CvRow } from "./cvBuilder.helpers";

interface FieldLabelProps {
  children: ReactNode;
}

interface CvFileFieldProps {
  file: File | null;
  label: string;
  onFileChange: (file: File | null) => void;
}

interface TextInputFieldProps {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

interface NotesFieldProps {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

interface CvVersionSummaryProps {
  row: CvRow;
}

interface CvVersionActionProps {
  downloadUrl: string | undefined;
  emptyLabel: string;
  openLabel: string;
}

export function CvFileField({ file, label, onFileChange }: CvFileFieldProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
      {file ? (
        <div className="text-xs text-muted-foreground">
          {file.name} - {formatBytes(file.size)}
        </div>
      ) : null}
    </div>
  );
}

export function TextInputField({
  label,
  onChange,
  placeholder,
  value,
}: TextInputFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <Input preset="default" value={value} onChange={handleChange} placeholder={placeholder} />
    </div>
  );
}

export function NotesField({ label, onChange, placeholder, value }: NotesFieldProps) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="w-full min-h-[70px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export function CvVersionSummary({ row }: CvVersionSummaryProps) {
  const title = row.data.label || row.data.fileName;

  return (
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-foreground">{title}</div>
      <div className="truncate text-xs text-muted-foreground">
        {row.data.fileName} - {formatBytes(row.data.sizeBytes)} - {row.data.mimeType}
      </div>
      {row.data.notes ? <div className="mt-1 text-xs text-muted-foreground">{row.data.notes}</div> : null}
    </div>
  );
}

export function CvVersionAction({
  downloadUrl,
  emptyLabel,
  openLabel,
}: CvVersionActionProps) {
  if (!downloadUrl) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <a
      className="text-sm font-medium text-foreground hover:underline"
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
    >
      {openLabel}
    </a>
  );
}

function FieldLabel({ children }: FieldLabelProps) {
  return <div className="text-xs text-muted-foreground">{children}</div>;
}
