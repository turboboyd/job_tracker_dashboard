import {
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  type CanonicalFilters,
  type Loop,
  type LoopPlatform,
  type RemoteMode,
} from "../../model";
import type { CreateLoopInput, UpdateLoopInput } from "../loopApi.types";

import {
  makeTimestamps,
  mapLoopRecordToEntity,
  trimArray,
  trimStr,
} from "./loopApi.mapperUtils";

export interface ApiError { message: string }

// --------------------
// Firestore payloads
// --------------------

export interface LoopFirestoreCreate {
  name: string;

  titles: string[];
  location: string;
  radiusKm: number;
  remoteMode: RemoteMode;
  platforms: LoopPlatform[];

  filters?: CanonicalFilters;

  createdAt?: string;
  updatedAt?: string;

  createdAtTs: FieldValue;
  updatedAtTs: FieldValue;
}

export type LoopFirestorePatch = Partial<
  Omit<LoopFirestoreCreate, "createdAtTs" | "updatedAtTs">
> & {
  updatedAtTs: FieldValue;
};

// --------------------
// mappers
// --------------------

export function mapLoopDoc(d: QueryDocumentSnapshot): Loop {
  const rest = { ...(d.data() as Record<string, unknown>) };
  delete (rest as { createdAtTs?: unknown }).createdAtTs;
  delete (rest as { updatedAtTs?: unknown }).updatedAtTs;

  return mapLoopRecordToEntity(d.id, rest);
}

export function mapLoopSnap(s: DocumentSnapshot): Loop | null {
  if (!s.exists()) return null;
  const rest = { ...((s.data() ?? {}) as Record<string, unknown>) };
  delete (rest as { createdAtTs?: unknown }).createdAtTs;
  delete (rest as { updatedAtTs?: unknown }).updatedAtTs;

  return mapLoopRecordToEntity(s.id, rest);
}

// --------------------
// cleaners
// --------------------

export function cleanLoopCreate(input: CreateLoopInput): LoopFirestoreCreate {
  const { iso, server } = makeTimestamps();

  return {
    name: trimStr(input.name),

    titles: trimArray(input.titles),
    location: trimStr(input.location),
    radiusKm: Number.isFinite(input.radiusKm) ? input.radiusKm : 30,
    remoteMode: input.remoteMode,
    platforms: input.platforms,

    ...(input.filters !== undefined ? { filters: input.filters } : {}),

    createdAt: iso,
    updatedAt: iso,

    createdAtTs: server,
    updatedAtTs: server,
  };
}

export function cleanLoopPatch(input: UpdateLoopInput): LoopFirestorePatch {
  const { iso, server } = makeTimestamps();

  const patch: LoopFirestorePatch = {
    updatedAt: iso,
    updatedAtTs: server,
  };

  if (typeof input.name === "string") patch.name = trimStr(input.name);
  if (Array.isArray(input.titles)) patch.titles = trimArray(input.titles);
  if (typeof input.location === "string") patch.location = trimStr(input.location);
  if (typeof input.radiusKm === "number" && Number.isFinite(input.radiusKm))
    patch.radiusKm = input.radiusKm;
  if (typeof input.remoteMode === "string") patch.remoteMode = input.remoteMode;
  if (Array.isArray(input.platforms)) patch.platforms = input.platforms;

  if ("filters" in input) {
    if (input.filters !== undefined) patch.filters = input.filters;
    else delete (patch as { filters?: unknown }).filters;
  }

  return patch;
}

export function makeUpdateTsPatch(): { updatedAt: string; updatedAtTs: FieldValue } {
  const { iso, server } = makeTimestamps();
  return { updatedAt: iso, updatedAtTs: server };
}
