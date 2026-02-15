import type {
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

export type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
};


export function snapToPage<T>(
  snap: QuerySnapshot<DocumentData>,
  mapDoc: (d: QueryDocumentSnapshot<DocumentData>) => T
): PageResult<T> {
  const items = snap.docs.map(mapDoc);
  const last = snap.docs[snap.docs.length - 1];
  return { items, nextCursor: last ? last.id : null };
}
