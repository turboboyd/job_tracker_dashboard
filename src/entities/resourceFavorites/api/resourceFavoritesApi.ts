import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import type { ApiError } from "src/shared/api/rtk/rtkError";
import { db } from "src/shared/config/firebase/firebase";

export type ResourceFavorites = {
  ids: string[];
  updatedAt?: Timestamp;
  userId?: string;
};

const favoritesDocRef = (uid: string) =>
  doc(db, "users", uid, "private", "resourcesFavorites");

const normalizeIds = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) return [];
  const cleaned = ids
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && x.length <= 128);

  return Array.from(new Set(cleaned)).slice(0, 500);
};

const normalizeFavorites = (
  input: Partial<ResourceFavorites> | undefined | null,
): ResourceFavorites => {
  return {
    ids: normalizeIds(input?.ids),
    updatedAt: input?.updatedAt,
    userId: typeof input?.userId === "string" ? input.userId : undefined,
  };
};

export const resourceFavoritesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserResourceFavorites: build.query<ResourceFavorites, { uid: string }>({
      queryFn: ({ uid }) =>
        guardRtk(async () => {
          const ref = favoritesDocRef(uid);
          const snap = await getDoc(ref);

          if (!snap.exists()) {
            const initial: ResourceFavorites = { ids: [], userId: uid };


            await setDoc(
              ref,
              { ...initial, updatedAt: serverTimestamp() },
              { merge: true },
            );

            return initial;
          }

          return normalizeFavorites(snap.data() as Partial<ResourceFavorites>);
        }),
      providesTags: (_r, _e, arg) => [{ type: "ResourceFavorites", id: arg.uid }],
    }),


    toggleUserResourceFavorite: build.mutation<
      ResourceFavorites,
      { uid: string; resourceId: string }
    >({
      queryFn: ({ uid, resourceId }): Promise<
        QueryReturnValue<ResourceFavorites, ApiError, undefined>
      > =>
        guardRtk(async () => {
          const id = resourceId.trim();
          if (!id) return { ids: [], userId: uid };

          const ref = favoritesDocRef(uid);

          const result = await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref);

            const current = snap.exists()
              ? normalizeFavorites(snap.data() as Partial<ResourceFavorites>)
              : ({ ids: [], userId: uid } as ResourceFavorites);

            const set = new Set(current.ids);
            if (set.has(id)) set.delete(id);
            else set.add(id);

            const next: ResourceFavorites = {
              ids: Array.from(set).slice(0, 500),
              userId: uid,
            };

            tx.set(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });

            return next;
          });

          return result;
        }),

      async onQueryStarted({ uid, resourceId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          resourceFavoritesApi.util.updateQueryData(
            "getUserResourceFavorites",
            { uid },
            (draft) => {
              const id = resourceId.trim();
              const set = new Set(draft?.ids ?? []);
              if (set.has(id)) set.delete(id);
              else set.add(id);
              draft.ids = Array.from(set).slice(0, 500);
              draft.userId = uid;
            },
          ),
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            resourceFavoritesApi.util.updateQueryData(
              "getUserResourceFavorites",
              { uid },
              (draft) => {
                draft.ids = data.ids;
                draft.userId = data.userId;
              },
            ),
          );
        } catch {
          patch.undo();
        }
      },

      invalidatesTags: (_r, _e, arg) => [{ type: "ResourceFavorites", id: arg.uid }],
    }),
  }),
});

export const {
  useGetUserResourceFavoritesQuery,
  useToggleUserResourceFavoriteMutation,
} = resourceFavoritesApi;