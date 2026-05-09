import type { CvVersionDoc } from "src/features/cvVersions";

export interface CvRow {
  data: CvVersionDoc;
  downloadUrl?: string;
  id: string;
}

export interface CvUploadDraft {
  file: File;
  label: string;
  notes: string;
}

export interface CvUploadInput {
  file: File;
  label?: string;
  notes?: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function buildCvUploadInput({ file, label, notes }: CvUploadDraft): CvUploadInput {
  const trimmedLabel = label.trim();
  const trimmedNotes = notes.trim();

  return {
    file,
    ...(trimmedLabel ? { label: trimmedLabel } : {}),
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
  };
}

export async function attachDownloadUrls(
  rows: { data: CvVersionDoc; id: string }[],
  getDownloadUrl: (filePath: string) => Promise<string>,
): Promise<CvRow[]> {
  const result: CvRow[] = [];

  for (const row of rows) {
    try {
      const downloadUrl = await getDownloadUrl(row.data.filePath);
      result.push({ ...row, downloadUrl });
    } catch {
      result.push(row);
    }
  }

  return result;
}
