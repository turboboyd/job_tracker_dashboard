import {
  collection,
  deleteDoc,
  doc,
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

import type { LoopMatch } from "src/entities/loop/model";
import { baseApi } from "src/shared/api/baseApi";
import { db } from "src/shared/config/firebase/firebase";

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

export type GetAllMatchesArgs = { userId: string };
export type GetMatchArgs = { matchId: string };

export type UpdateMatchStatusInput = {
  userId: string;
  matchId: string;
  status: LoopMatch["status"];
};

export type UpdateMatchInput = {
  userId: string;
  matchId: string;
  patch: Partial<
    Pick<
      LoopMatch,
      | "title"
      | "company"
      | "location"
      | "url"
      | "description"
      | "matchedAt"
      | "platform"
    >
  >;
};

export type DeleteMatchInput = {
  userId: string;
  matchId: string;
};

function normalizeUrl(input: string): string {
  const v = String(input ?? "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

export const matchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --------------------
    // LIST: all matches
    // --------------------
    getAllMatches: builder.query<LoopMatch[], GetAllMatchesArgs>({
      async queryFn({ userId }) {
        try {
          const q = query(
            collection(db, "loopMatches"),
            where("userId", "==", userId),
            orderBy("matchedAt", "desc")
          );

          const snap = await getDocs(q);
          const matches: LoopMatch[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LoopMatch, "id">),
          }));

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
    // GET: one match by id
    // --------------------
    getMatch: builder.query<LoopMatch | null, GetMatchArgs>({
      async queryFn({ matchId }) {
        try {
          const snap = await getDoc(doc(db, "loopMatches", matchId));
          if (!snap.exists()) return { data: null };

          const m: LoopMatch = {
            id: snap.id,
            ...(snap.data() as Omit<LoopMatch, "id">),
          };
          return { data: m };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },
      providesTags: (_res, _err, arg) => [
        { type: "LoopMatches" as const, id: arg.matchId },
      ],
    }),

    // --------------------
    // UPDATE: status only
    // --------------------
    updateMatchStatus: builder.mutation<void, UpdateMatchStatusInput>({
      async queryFn({ matchId, status }) {
        try {
          const { iso, server } = makeTimestamps();
          await updateDoc(doc(db, "loopMatches", matchId), {
            status,
            updatedAt: iso,
            updatedAtTs: server,
          } as UpdateData<Omit<LoopMatch, "id">>);

          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },

      // Optimistic: update list + single
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          matchesApi.util.updateQueryData(
            "getAllMatches",
            { userId: arg.userId },
            (draft) => {
              const m = draft.find((x) => x.id === arg.matchId);
              if (m) m.status = arg.status;
            }
          )
        );

        const patchOne = dispatch(
          matchesApi.util.updateQueryData(
            "getMatch",
            { matchId: arg.matchId },
            (draft) => {
              if (draft) draft.status = arg.status;
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchOne.undo();
        }
      },

      invalidatesTags: (_r, _e, a) => [{ type: "LoopMatches", id: a.matchId }],
    }),

    // --------------------
    // UPDATE: full patch (optional)
    // --------------------
    updateMatch: builder.mutation<void, UpdateMatchInput>({
      async queryFn({ matchId, patch }) {
        try {
          const { iso, server } = makeTimestamps();

          const safePatch: Record<string, unknown> = { ...patch };

          if (typeof safePatch.url === "string") {
            safePatch.url = normalizeUrl(safePatch.url);
          }

          await updateDoc(doc(db, "loopMatches", matchId), {
            ...safePatch,
            updatedAt: iso,
            updatedAtTs: server,
          } as UpdateData<Omit<LoopMatch, "id">>);

          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          matchesApi.util.updateQueryData(
            "getAllMatches",
            { userId: arg.userId },
            (draft) => {
              const m = draft.find((x) => x.id === arg.matchId);
              if (m) Object.assign(m, arg.patch);
            }
          )
        );

        const patchOne = dispatch(
          matchesApi.util.updateQueryData(
            "getMatch",
            { matchId: arg.matchId },
            (draft) => {
              if (draft) Object.assign(draft, arg.patch);
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchOne.undo();
        }
      },

      invalidatesTags: (_r, _e, a) => [{ type: "LoopMatches", id: a.matchId }],
    }),

    // --------------------
    // DELETE
    // --------------------
    deleteMatch: builder.mutation<void, DeleteMatchInput>({
      async queryFn({ matchId }) {
        try {
          await deleteDoc(doc(db, "loopMatches", matchId));
          return { data: undefined };
        } catch (e) {
          return rtkError(toMsg(e));
        }
      },

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          matchesApi.util.updateQueryData(
            "getAllMatches",
            { userId: arg.userId },
            (draft) => {
              const idx = draft.findIndex((x) => x.id === arg.matchId);
              if (idx !== -1) draft.splice(idx, 1);
            }
          )
        );

        // after delete, single query should become null
        const patchOne = dispatch(
          matchesApi.util.updateQueryData(
            "getMatch",
            { matchId: arg.matchId },
            () => null
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchOne.undo();
        }
      },

      invalidatesTags: (_r, _e, a) => [
        { type: "LoopMatches", id: a.matchId },
        { type: "LoopMatches", id: "LIST:ALL" },
      ],
    }),
  }),
});

export const {
  useGetAllMatchesQuery,
  useGetMatchQuery,
  useUpdateMatchStatusMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
} = matchesApi;
