import {
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { normalizeStatus, STATUS } from "src/entities/application/model/status";
import {
  createApplication,
  updateApplicationWithHistory,
  changeStatus,
  type ApplicationDoc,
  type ProcessStatus,
} from "src/features/applications/firestoreApplications";
import { userApplicationDoc, userApplicationsCol } from "src/shared/api/firestoreRefs";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { requireUidFromState } from "src/shared/api/rtk/requireUid";
import { db } from "src/shared/config/firebase/firebase";

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

function isoNow(): string {
  return new Date().toISOString();
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

// Loop match status is the shared StatusKey.

function statusKeyToProcessStatus(s: LoopMatch["status"]): ProcessStatus {
  const meta = STATUS[s];
  switch (meta.stage) {
    case "ACTIVE":
      return "APPLIED";
    case "INTERVIEW":
      return "INTERVIEW_1";
    case "OFFER":
      return "OFFER";
    case "HIRED":
      // Backend enum has no dedicated "HIRED/STARTED" value. Keep it in the latest available stage.
      return "OFFER";
    case "REJECTED":
      return "REJECTED";
    case "NO_RESPONSE":
      return "NO_RESPONSE";
    case "ARCHIVED":
      // Backend enum has no archived value. Treat as inactive/saved.
      return "SAVED";
    default:
      return "SAVED";
  }
}

type ToDateLike = { toDate: () => Date };

function isToDateLike(x: unknown): x is ToDateLike {
  const r = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
  return typeof r?.toDate === "function";
}

function tsToIso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v).toISOString();
  if (isToDateLike(v)) return v.toDate().toISOString();
  return "";
}

function mapApplicationToLoopMatch(id: string, app: ApplicationDoc): LoopMatch {
  const matchedAt =
    tsToIso(app.loopLinkage?.matchedAt) || tsToIso(app.createdAt) || isoNow();
  const createdAt = tsToIso(app.createdAt) || matchedAt;
  const updatedAt = tsToIso(app.updatedAt) || createdAt;

  const norm = normalizeStatus(app);

  return {
    id,
    loopId: app.loopLinkage?.loopId ?? "",
    title: app.job.roleTitle,
    company: app.job.companyName,
    location: app.job.locationText ?? "",
    platform:
      (typeof app.loopLinkage?.platform === "string" && app.loopLinkage.platform) ||
      (typeof app.job?.source === "string" && app.job.source) ||
      "",
    url: app.job.vacancyUrl ?? "",
    description: app.vacancy?.rawDescription ?? "",
    status: norm.subStatus,
    matchedAt,
    createdAt,
    updatedAt,
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
          // Unified source: users/{uid}/applications.
          // We avoid orderBy to keep indexes simple and sort client-side.
          const snap = await getDocs(query(userApplicationsCol(uid)));
          const items: LoopMatch[] = snap.docs
            .map((d) => ({ id: d.id, app: d.data() as ApplicationDoc }))
            .filter((x) => Boolean(x.app.loopLinkage?.loopId))
            .map((x) => mapApplicationToLoopMatch(x.id, x.app));

          items.sort((a, b) => (b.matchedAt || "").localeCompare(a.matchedAt || ""));
          return { data: items };
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
          const snap = await getDocs(
            query(userApplicationsCol(uid), where("loopLinkage.loopId", "==", loopId)),
          );

          const items: LoopMatch[] = snap.docs.map((d) =>
            mapApplicationToLoopMatch(d.id, d.data() as ApplicationDoc),
          );

          items.sort((a, b) => (b.matchedAt || "").localeCompare(a.matchedAt || ""));
          return { data: items };
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
          const snap = await getDoc(userApplicationDoc(uid, matchId));
          if (!snap.exists()) return { data: null };

          return { data: mapApplicationToLoopMatch(snap.id, snap.data() as ApplicationDoc) };
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

          const id = await createApplication(db, uid, {
            companyName: input.company,
            roleTitle: input.title,
            locationText: input.location,
            vacancyUrl: normalizeUrl(input.url),
            source: String(input.platform ?? "").toLowerCase(),
            rawDescription: input.description,
            status: statusKeyToProcessStatus(input.status),

            loopId: input.loopId,
            loopPlatform: String(input.platform ?? "").toLowerCase(),
            loopMatchedAt: input.matchedAt ? new Date(input.matchedAt) : undefined,
            loopSource: "loop",
          });

          return { data: { id } };
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
          const uid = requireUidFromState(api.getState());

          await changeStatus(db, uid, matchId, statusKeyToProcessStatus(status));

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
          const uid = requireUidFromState(api.getState());

          const p = cleanPatch(patch);
          const dotPatch: Record<string, unknown> = {};

          if (typeof p.title === "string") dotPatch["job.roleTitle"] = p.title;
          if (typeof p.company === "string") dotPatch["job.companyName"] = p.company;
          if (typeof p.location === "string") dotPatch["job.locationText"] = p.location;
          if (typeof p.url === "string") dotPatch["job.vacancyUrl"] = p.url;
          if (typeof p.platform === "string") {
            dotPatch["loopLinkage.platform"] = p.platform;
            dotPatch["job.source"] = p.platform;
          }
          if (typeof p.description === "string") dotPatch["vacancy.rawDescription"] = p.description;
          if (typeof p.matchedAt === "string" && p.matchedAt.trim()) {
            dotPatch["loopLinkage.matchedAt"] = Timestamp.fromDate(new Date(p.matchedAt));
          }
          if (typeof p.status === "string") {
            dotPatch["process.status"] = statusKeyToProcessStatus(p.status);
            dotPatch["process.lastStatusChangeAt"] = Timestamp.fromDate(new Date());
          }

          await updateApplicationWithHistory(db, uid, matchId, dotPatch, () => [
            {
              actor: "user",
              type: "FIELD_CHANGE",
              fieldPath: "legacy.loopMatch",
              oldValue: null,
              newValue: p,
            },
          ]);

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
          await deleteDoc(userApplicationDoc(uid, matchId));
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
