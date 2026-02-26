import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth";
import {
  getCvDownloadUrl,
  listCvVersions,
  uploadCvVersion,
  type CvVersionDoc,
} from "src/features/cvVersions/firestoreCvVersions";
import { db, storage } from "src/shared/config/firebase/firebase";
import { Button, Card, InlineError } from "src/shared/ui";
import { Input } from "src/shared/ui/Form/Input";


type CvRow = { id: string; data: CvVersionDoc; downloadUrl?: string };

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function CvBuilderPage() {
  const { t } = useTranslation();
  const { userId, isAuthReady } = useAuthSelectors();

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  const [list, setList] = useState<CvRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = useMemo(() => !!userId && !!file && !isUploading, [userId, file, isUploading]);

  const listNode = useMemo(() => {
    if (isLoading) {
      return (
        <div className="text-sm text-muted-foreground">
          {t("cvBuilder.list.loading", "Loading…")}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {t("cvBuilder.list.empty", "No CV versions yet.")}
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {list.map((r) => (
          <div key={r.id} className="py-sm flex items-center gap-md">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {r.data.label || r.data.fileName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {r.data.fileName} • {formatBytes(r.data.sizeBytes)} • {r.data.mimeType}
              </div>
              {r.data.notes ? (
                <div className="mt-1 text-xs text-muted-foreground">{r.data.notes}</div>
              ) : null}
            </div>

            {r.downloadUrl ? (
              <a
                className="text-sm font-medium text-foreground hover:underline"
                href={r.downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("cvBuilder.list.open", "Open")}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ))}
      </div>
    );
  }, [isLoading, list, t]);

  async function load() {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listCvVersions(db, userId, 50);
      // lazy resolve download urls
      const withUrls: CvRow[] = [];
      for (const r of rows) {
        let url: string | undefined;
        try {
          url = await getCvDownloadUrl(storage, r.data.filePath);
        } catch {
          url = undefined;
        }
        withUrls.push({ id: r.id, data: r.data, downloadUrl: url });
      }
      setList(withUrls);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, userId]);

  async function onUpload() {
    if (!userId || !file) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadCvVersion(db, storage, userId, {
        file,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setFile(null);
      setLabel("");
      setNotes("");
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-lg">
      <div>
        <div className="text-xl font-semibold text-foreground">
          {t("cvBuilder.title", "CV Builder")}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("cvBuilder.subtitle", "Upload CV versions and link them to applications.")}
        </div>
      </div>

      {error ? <InlineError message={error} /> : null}

      <Card padding="md" shadow="sm" className="space-y-md">
        <div className="text-base font-semibold">{t("cvBuilder.upload.title","Upload CV")}</div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("cvBuilder.upload.file","File")}</div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="text-xs text-muted-foreground">
                {file.name} • {formatBytes(file.size)}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("cvBuilder.upload.label","Label")}</div>
            <Input
              preset="default"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("cvBuilder.upload.labelPh","e.g. Frontend CV v3")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t("cvBuilder.upload.notes","Notes")}</div>
          <textarea
            className="w-full min-h-[70px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("cvBuilder.upload.notesPh","Optional notes…")}
          />
        </div>

        <div className="flex justify-end">
          <Button disabled={!canUpload} onClick={onUpload}>
            {isUploading ? t("cvBuilder.upload.uploading","Uploading…") : t("cvBuilder.upload.upload","Upload")}
          </Button>
        </div>
      </Card>

      <Card padding="md" shadow="sm" className="space-y-sm">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{t("cvBuilder.list.title","CV Versions")}</div>
          <Button size="sm" variant="outline" disabled={!userId || isLoading} onClick={load}>
            {t("cvBuilder.list.refresh","Refresh")}
          </Button>
        </div>

        {listNode}
      </Card>
    </div>
  );
}
