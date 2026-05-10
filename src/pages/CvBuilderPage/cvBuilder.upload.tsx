import { useTranslation } from "react-i18next";

import { Button, Card } from "src/shared/ui";

import { CvFileField, NotesField, TextInputField } from "./cvBuilder.fields";

interface CvBuilderUploadCardProps {
  canUpload: boolean;
  file: File | null;
  isUploading: boolean;
  label: string;
  notes: string;
  onFileChange: (file: File | null) => void;
  onLabelChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onUpload: () => void;
}

export function CvBuilderUploadCard({
  canUpload,
  file,
  isUploading,
  label,
  notes,
  onFileChange,
  onLabelChange,
  onNotesChange,
  onUpload,
}: CvBuilderUploadCardProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md" shadow="sm" className="space-y-md">
      <div className="text-base font-semibold">{t("cvBuilder.upload.title", "Upload CV")}</div>

      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        <CvFileField
          file={file}
          label={t("cvBuilder.upload.file", "File")}
          onFileChange={onFileChange}
        />

        <TextInputField
          label={t("cvBuilder.upload.label", "Label")}
          value={label}
          onChange={onLabelChange}
          placeholder={t("cvBuilder.upload.labelPh", "e.g. Frontend CV v3")}
        />
      </div>

      <NotesField
        label={t("cvBuilder.upload.notes", "Notes")}
        value={notes}
        onChange={onNotesChange}
        placeholder={t("cvBuilder.upload.notesPh", "Optional notes...")}
      />

      <div className="flex justify-end">
        <Button disabled={!canUpload} onClick={onUpload}>
          {isUploading
            ? t("cvBuilder.upload.uploading", "Uploading...")
            : t("cvBuilder.upload.upload", "Upload")}
        </Button>
      </div>
    </Card>
  );
}
