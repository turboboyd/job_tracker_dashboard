import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthSelectors } from "src/features/auth/model";
import { getCvDownloadUrl, listCvVersions, uploadCvVersion } from "src/features/cvVersions";
import { db } from "src/shared/config/firebase/firestore";
import { storage } from "src/shared/config/firebase/storage";
import { getErrorMessage } from "src/shared/lib";

import {
  attachDownloadUrls,
  buildCvUploadInput,
  type CvRow,
} from "./cvBuilder.helpers";

export interface CvBuilderUploadViewModel {
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

export interface CvBuilderVersionsViewModel {
  isLoading: boolean;
  list: CvRow[];
  onRefresh: () => void;
  userId?: string | null;
}

export interface CvBuilderPageViewModel {
  error: string | null;
  upload: CvBuilderUploadViewModel;
  versions: CvBuilderVersionsViewModel;
}

export function useCvBuilderPageController(): CvBuilderPageViewModel {
  const { userId, isAuthReady } = useAuthSelectors();

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState<CvRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = useMemo(() => Boolean(userId && file && !isUploading), [file, isUploading, userId]);

  const loadCvVersions = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const rows = await listCvVersions(db, userId, 50);
      const withUrls = await attachDownloadUrls(rows, (filePath) => getCvDownloadUrl(storage, filePath));
      setList(withUrls);
    } catch (error_: unknown) {
      setError(getErrorMessage(error_));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshCvVersions = useCallback(() => {
    void loadCvVersions();
  }, [loadCvVersions]);

  const uploadSelectedFile = useCallback(async () => {
    if (!userId || !file) return;

    setIsUploading(true);
    setError(null);

    try {
      await uploadCvVersion(db, storage, userId, buildCvUploadInput({ file, label, notes }));
      setFile(null);
      setLabel("");
      setNotes("");
      await loadCvVersions();
    } catch (error_: unknown) {
      setError(getErrorMessage(error_));
    } finally {
      setIsUploading(false);
    }
  }, [file, label, loadCvVersions, notes, userId]);

  const submitUpload = useCallback(() => {
    void uploadSelectedFile();
  }, [uploadSelectedFile]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    void loadCvVersions();
  }, [isAuthReady, loadCvVersions, userId]);

  return {
    error,
    upload: {
      canUpload,
      file,
      isUploading,
      label,
      notes,
      onFileChange: setFile,
      onLabelChange: setLabel,
      onNotesChange: setNotes,
      onUpload: submitUpload,
    },
    versions: {
      isLoading,
      list,
      onRefresh: refreshCvVersions,
      userId,
    },
  };
}
