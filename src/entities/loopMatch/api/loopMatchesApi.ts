import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type FieldValue,
  type UpdateData,
} from "firebase/firestore";

import { userLoopMatchDoc, userLoopMatchesCol } from "src/shared/api/firestoreRefs";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { requireUidFromState } from "src/shared/api/rtk/requireUid";

import type {
  CreateLoopMatchInput,
  DeleteLoopMatchInput,
  LoopMatch,
  UpdateLoopMatchInput,
  UpdateLoopMatchStatusInput,
} from "../model/types";


type ApiError = { message: string };

function toMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function rtkError(message: string) {
  return { error: { message } as ApiError } as const;
}

function makeTimestamps(): { iso: string; server: FieldValue } {
  const iso = new Date().toISOString();
  return { iso, server: serverTimestamp() };
}

export type GetMatchesByLoopArgs = { loopId: string };
export type GetMatchArgs = { matchId: string };

function normalizeUrl(input: string): string {
  const v = String(input ?? "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function cleanPatch(patch: UpdateLoopMatchInput["patch"]): UpdateLoopMatchInput["patch"] {
  const out: UpdateLoopMatchInput["patch"] = { ...patch };
  if (typeof out.url === "string") out.url = normalizeUrl(out.url);
  return out;
}

function mapLoopMatchDoc(id: string, data: Record<string, unknown>): LoopMatch {
  // Firestore stores server timestamps as Timestamp objects.
  // Those are not serializable and must not end up in RTK Query cache.
  const rest = { ...data };
  delete (rest as { createdAtTs?: unknown }).createdAtTs;
  delete (rest as { updatedAtTs?: unknown }).updatedAtTs;

  return {
    id,
    ...(rest as Omit<LoopMatch, "id">),
  };
}

export const loopMatchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --------------------
    // LIST: all matches
    // --------------------
    getAllMatches: builder.query<LoopMatch[], void>({
      async queryFn(_arg, api) {
        try {
          const uid = requireUidFromState(api.getState());
          const q = query(
            userLoopMatchesCol(uid),
            orderBy("matchedAt", "desc")
          );

          const snap = await getDocs(q);
          const matches: LoopMatch[] = snap.docs.map((d) =>
            mapLoopMatchDoc(d.id, d.data() as Record<string, unknown>),
          );

          return { data: matches };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      providesTags: (res) =>
        res
          ? [
              ...res.map((m) => ({ type: "LoopMatches" as const, id: m.id })),
              { type: "LoopMatches" as const, id: "LIST:ALL" },
            ]
          : [{ type: "LoopMatches" as const, id: "LIST:ALL" }],
    }),

    // --------------------
    // LIST: matches by loopId
    // --------------------
    getMatchesByLoop: builder.query<LoopMatch[], GetMatchesByLoopArgs>({
      async queryFn({ loopId }, api) {
        try {
          const uid = requireUidFromState(api.getState());
          const q = query(
            userLoopMatchesCol(uid),
            // loopId remains a field to filter matches that belong to a loop
            // (even though ownership is already enforced by path)
            where("loopId", "==", loopId),
            orderBy("matchedAt", "desc")
          );

          const snap = await getDocs(q);
          const matches: LoopMatch[] = snap.docs.map((d) =>
            mapLoopMatchDoc(d.id, d.data() as Record<string, unknown>),
          );

          return { data: matches };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      providesTags: (_res, _err, arg) => [
        { type: "LoopMatches" as const, id: `LIST:LOOP:${arg.loopId}` },
      ],
    }),

    // --------------------
    // GET: one match by id
    // --------------------
    getMatch: builder.query<LoopMatch | null, GetMatchArgs>({
      async queryFn({ matchId }, api) {
        try {
          const uid = requireUidFromState(api.getState());
          const snap = await getDoc(userLoopMatchDoc(uid, matchId));
          if (!snap.exists()) return { data: null };

          return {
            data: mapLoopMatchDoc(
              snap.id,
              (snap.data() as Record<string, unknown>) ?? {},
            ),
          };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      providesTags: (_res, _err, arg) => [
        { type: "LoopMatches" as const, id: arg.matchId },
      ],
    }),

    // --------------------
    // CREATE
    // --------------------
    createMatch: builder.mutation<{ id: string }, CreateLoopMatchInput>({
      async queryFn(input, api) {
        try {
          const uid = requireUidFromState(api.getState());
          const { iso, server } = makeTimestamps();

          const payload = {
            ...input,
            url: normalizeUrl(input.url),
            createdAt: iso,
            updatedAt: iso,
            createdAtTs: server,
            updatedAtTs: server,
          } as Record<string, unknown>;

          const ref = await addDoc(userLoopMatchesCol(uid), payload);
          return { data: { id: ref.id } };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "LoopMatches" as const, id: "LIST:ALL" },
        { type: "LoopMatches" as const, id: `LIST:LOOP:${arg.loopId}` },
      ],
    }),

    // --------------------
    // UPDATE: status only
    // --------------------
    updateMatchStatus: builder.mutation<void, UpdateLoopMatchStatusInput>({
      async queryFn({ matchId, status }, api) {
        try {
          const { iso, server } = makeTimestamps();
          const uid = requireUidFromState(api.getState());

          await updateDoc(userLoopMatchDoc(uid, matchId), {
            status,
            updatedAt: iso,
            updatedAtTs: server,
          } as UpdateData<Omit<LoopMatch, "id">>);

          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "LoopMatches" as const, id: arg.matchId },
        { type: "LoopMatches" as const, id: "LIST:ALL" },
        { type: "LoopMatches" as const, id: `LIST:LOOP:${arg.loopId}` },
      ],
    }),

    // --------------------
    // UPDATE: fields
    // --------------------
    updateMatch: builder.mutation<void, UpdateLoopMatchInput>({
      async queryFn({ matchId, patch }, api) {
        try {
          const { iso, server } = makeTimestamps();
          const cleaned = cleanPatch(patch);

          const uid = requireUidFromState(api.getState());

          await updateDoc(userLoopMatchDoc(uid, matchId), {
            ...cleaned,
            updatedAt: iso,
            updatedAtTs: server,
          } as UpdateData<Omit<LoopMatch, "id">>);

          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "LoopMatches" as const, id: arg.matchId },
        { type: "LoopMatches" as const, id: "LIST:ALL" },
        // We don't know the loopId from patch alone; we invalidate all matches list.
      ],
    }),

    // --------------------
    // DELETE
    // --------------------
    deleteMatch: builder.mutation<void, DeleteLoopMatchInput>({
      async queryFn({ matchId }, api) {
        try {
          const uid = requireUidFromState(api.getState());
          await deleteDoc(userLoopMatchDoc(uid, matchId));
          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "LoopMatches" as const, id: arg.matchId },
        { type: "LoopMatches" as const, id: "LIST:ALL" },
        { type: "LoopMatches" as const, id: `LIST:LOOP:${arg.loopId}` },
      ],
    }),
  }),
});

export const {
  useGetAllMatchesQuery,
  useGetMatchesByLoopQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchStatusMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
} = loopMatchesApi;
