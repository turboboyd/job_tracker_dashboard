import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { getDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";

import { userOutcomeDoc } from "src/shared/api/firestoreRefs";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import type { ApiError } from "src/shared/api/rtk/rtkError";
import { toMillisOptional } from "src/shared/lib/firestore/toMillis";

import type { UserOutcome } from "../model/types";

export const outcomeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOutcome: build.query<UserOutcome | null, { uid: string }>({
      queryFn: ({ uid }): Promise<QueryReturnValue<UserOutcome | null, ApiError, {}>> =>
        guardRtk(async () => {
          const ref = userOutcomeDoc(uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) return null;

          const raw = (snap.data() ?? {}) as Record<string, unknown>;
          const feedback = raw.feedback as UserOutcome["feedback"];
          const updatedAt = toMillisOptional(raw.updatedAt);

          return {
            userId: typeof raw.userId === "string" ? raw.userId : uid,
            employmentStatus: (raw.employmentStatus as UserOutcome["employmentStatus"]) ?? "waiting",
            ...(feedback !== undefined ? { feedback } : {}),
            ...(updatedAt !== undefined ? { updatedAt } : {}),
          };
        }),
      providesTags: (_r, _e, arg) => [{ type: "UserSettings", id: `outcome-${arg.uid}` }],
    }),

    upsertOutcome: build.mutation<UserOutcome, { uid: string; data: UserOutcome }>({
      queryFn: ({ uid, data }): Promise<QueryReturnValue<UserOutcome, ApiError, {}>> =>
        guardRtk(async () => {
          const ref = userOutcomeDoc(uid);
          const payload: UserOutcome = { ...data, userId: uid, updatedAt: Date.now() };
          await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
          return payload;
        }),
      invalidatesTags: (_r, _e, arg) => [{ type: "UserSettings", id: `outcome-${arg.uid}` }],
    }),

    deleteOutcome: build.mutation<void, { uid: string }>({
      queryFn: ({ uid }): Promise<QueryReturnValue<void, ApiError, {}>> =>
        guardRtk(async () => {
          await deleteDoc(userOutcomeDoc(uid));
        }),
      invalidatesTags: (_r, _e, arg) => [{ type: "UserSettings", id: `outcome-${arg.uid}` }],
    }),
  }),
});

export const { useGetOutcomeQuery, useUpsertOutcomeMutation, useDeleteOutcomeMutation } = outcomeApi;
