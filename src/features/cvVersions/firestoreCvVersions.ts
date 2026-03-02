/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
// src/features/cvVersions/firestoreCvVersions.ts
import type {
  Firestore} from "firebase/firestore";
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
import type { FirebaseStorage} from "firebase/storage";
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
  // Optional: you can compute later
  hashSha256?: string;
}

function nowTs(): Timestamp {
  return Timestamp.now();
}

function cvVersionsCol(db: Firestore, userId: string) {
  return collection(db, "users", userId, "cv_versions");
}

export async function listCvVersions(
  db: Firestore,
  userId: string,
  take = 50
): Promise<{ id: string; data: CvVersionDoc }[]> {
  const q = query(cvVersionsCol(db, userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.slice(0, take).map((d) => ({ id: d.id, data: d.data() as CvVersionDoc }));
}

export async function uploadCvVersion(
  db: Firestore,
  storage: FirebaseStorage,
  userId: string,
  input: {
    file: File;
    label?: string;
    notes?: string;
  }
): Promise<string> {
  const cvId = doc(cvVersionsCol(db, userId)).id;
  const t = nowTs();

  const file = input.file;
  const safeName = file.name.replace(/\s+/g, "_");
  const filePath = `users/${userId}/cv_versions/${cvId}/${safeName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);

  const docRef = doc(db, "users", userId, "cv_versions", cvId);
  const notes = input.notes?.trim();
  const payload: CvVersionDoc = {
    createdAt: t,
    updatedAt: t,
    label: input.label?.trim() || safeName,
    filePath,
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type || "application/octet-stream",
    ...(notes ? { notes } : {}),
  };

  await setDoc(docRef, payload);
  return cvId;
}

export async function getCvDownloadUrl(storage: FirebaseStorage, filePath: string): Promise<string> {
  return getDownloadURL(ref(storage, filePath));
}

export async function renameCvVersion(
  db: Firestore,
  userId: string,
  cvId: string,
  label: string
): Promise<void> {
  const ref = doc(db, "users", userId, "cv_versions", cvId);
  await updateDoc(ref, { label, updatedAt: nowTs() });
}
