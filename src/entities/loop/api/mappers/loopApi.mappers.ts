import {
  serverTimestamp,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  DEFAULT_CANONICAL_FILTERS,
  type CanonicalFilters,
  type Loop,
  type LoopPlatform,
  type RemoteMode,
} from "../../model";
import type { CreateLoopInput, UpdateLoopInput } from "../loopApi.types";

// --------------------
// shared utils
// --------------------

export type ApiError = { message: string };
function trimStr(v: unknown): string {
  return String(v ?? "").trim();
}

function trimArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(trimStr).filter(Boolean);
}



function makeTimestamps(): { iso: string; server: FieldValue } {
  const iso = new Date().toISOString();
  return { iso, server: serverTimestamp() };
}

// --------------------
// Firestore payloads
// --------------------

export type LoopFirestoreCreate = {
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
};

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

  const filters = (rest.filters ?? undefined) as CanonicalFilters | undefined;
  const normalizedFilters: CanonicalFilters | undefined =
    filters ? { ...DEFAULT_CANONICAL_FILTERS, ...filters } : undefined;

  return {
    id: d.id,
    name: String(rest.name ?? ""),
    titles: Array.isArray(rest.titles)
      ? rest.titles.map((x) => String(x)).filter(Boolean)
      : [],
    location: String(rest.location ?? ""),
    radiusKm: Number(rest.radiusKm ?? 30),
    remoteMode: (rest.remoteMode as RemoteMode) ?? "any",
    platforms: Array.isArray(rest.platforms)
      ? (rest.platforms.map((x) => String(x)) as LoopPlatform[])
      : [],
    filters: normalizedFilters,
    createdAtTs: null,
    updatedAtTs: null,
  };
}

export function mapLoopSnap(s: DocumentSnapshot): Loop | null {
  if (!s.exists()) return null;
  const rest = { ...((s.data() ?? {}) as Record<string, unknown>) };
  delete (rest as { createdAtTs?: unknown }).createdAtTs;
  delete (rest as { updatedAtTs?: unknown }).updatedAtTs;

  const filters = (rest.filters ?? undefined) as CanonicalFilters | undefined;
  const normalizedFilters: CanonicalFilters | undefined =
    filters ? { ...DEFAULT_CANONICAL_FILTERS, ...filters } : undefined;

  return {
    id: s.id,
    name: String(rest.name ?? ""),
    titles: Array.isArray(rest.titles)
      ? rest.titles.map((x) => String(x)).filter(Boolean)
      : [],
    location: String(rest.location ?? ""),
    radiusKm: Number(rest.radiusKm ?? 30),
    remoteMode: (rest.remoteMode as RemoteMode) ?? "any",
    platforms: Array.isArray(rest.platforms)
      ? (rest.platforms.map((x) => String(x)) as LoopPlatform[])
      : [],
    filters: normalizedFilters,
    createdAtTs: null,
    updatedAtTs: null,
  };
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

    filters: input.filters ?? undefined,

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

  if ("filters" in input) patch.filters = input.filters ?? undefined;

  return patch;
}

export function makeUpdateTsPatch(): { updatedAt: string; updatedAtTs: FieldValue } {
  const { iso, server } = makeTimestamps();
  return { updatedAt: iso, updatedAtTs: server };
}
