import type { Firestore } from "firebase/firestore";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export interface CvVersionDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  label: string;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  notes?: string;
  hashSha256?: string;
}

export interface CvVersionRow {
  id: string;
  data: CvVersionDoc;
}

interface UploadCvVersionInput {
  file: File;
  label?: string;
  notes?: string;
}

const DEFAULT_MIME_TYPE = "application/octet-stream";
const DEFAULT_TAKE = 50;
const FILE_NAME_SPACE_PATTERN = /\s+/g;

function nowTs(): Timestamp {
  return Timestamp.now();
}

function cvVersionsCol(db: Firestore, userId: string) {
  return collection(db, "users", userId, "cv_versions");
}

function cvVersionDoc(db: Firestore, userId: string, cvId: string) {
  return doc(db, "users", userId, "cv_versions", cvId);
}

function sanitizeStorageFileName(fileName: string): string {
  return fileName.replace(FILE_NAME_SPACE_PATTERN, "_");
}

function trimToOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function buildCvStoragePath(args: {
  cvId: string;
  safeName: string;
  userId: string;
}): string {
  return `users/${args.userId}/cv_versions/${args.cvId}/${args.safeName}`;
}

function buildCvVersionPayload(args: {
  file: File;
  filePath: string;
  label: string | undefined;
  notes: string | undefined;
  safeName: string;
  timestamp: Timestamp;
}): CvVersionDoc {
  const notes = trimToOptional(args.notes);
  const label = trimToOptional(args.label);
  const mimeType = trimToOptional(args.file.type);

  return {
    createdAt: args.timestamp,
    updatedAt: args.timestamp,
    label: label ?? args.safeName,
    filePath: args.filePath,
    fileName: args.file.name,
    sizeBytes: args.file.size,
    mimeType: mimeType ?? DEFAULT_MIME_TYPE,
    ...(notes ? { notes } : {}),
  };
}

export async function listCvVersions(
  db: Firestore,
  userId: string,
  take = DEFAULT_TAKE,
): Promise<CvVersionRow[]> {
  const versionsQuery = query(
    cvVersionsCol(db, userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(versionsQuery);

  return snap.docs.slice(0, take).map((document) => ({
    id: document.id,
    data: document.data() as CvVersionDoc,
  }));
}

export async function uploadCvVersion(
  db: Firestore,
  storage: FirebaseStorage,
  userId: string,
  input: UploadCvVersionInput,
): Promise<string> {
  const cvId = doc(cvVersionsCol(db, userId)).id;
  const timestamp = nowTs();
  const safeName = sanitizeStorageFileName(input.file.name);
  const filePath = buildCvStoragePath({ cvId, safeName, userId });

  await uploadBytes(ref(storage, filePath), input.file);
  await setDoc(
    cvVersionDoc(db, userId, cvId),
    buildCvVersionPayload({
      file: input.file,
      filePath,
      label: input.label,
      notes: input.notes,
      safeName,
      timestamp,
    }),
  );

  return cvId;
}

export async function getCvDownloadUrl(
  storage: FirebaseStorage,
  filePath: string,
): Promise<string> {
  return getDownloadURL(ref(storage, filePath));
}

export async function renameCvVersion(
  db: Firestore,
  userId: string,
  cvId: string,
  label: string,
): Promise<void> {
  await updateDoc(cvVersionDoc(db, userId, cvId), {
    label,
    updatedAt: nowTs(),
  });
}
