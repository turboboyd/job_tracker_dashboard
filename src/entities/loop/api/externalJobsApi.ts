import { getAuth } from "firebase/auth";

import { baseApi } from "src/shared/api/rtk/baseApi";

export type ExternalProvider = "adzuna" | "jooble";

export type ExternalJobHit = {
  source: ExternalProvider;
  title: string;
  company: string;
  location: string;
  url: string;
  snippet: string;
  postedAt?: string;
};

export type SearchExternalJobsArgs = {
  provider: ExternalProvider;
  q: string;
  location?: string;
  radiusKm?: number;
  remoteOnly?: boolean;
  page?: number;
};

export type SearchExternalJobsResp = { hits: ExternalJobHit[] };

type ErrorPayload = { error?: unknown; message?: unknown };

const FUNCTIONS_BASE =
  "http://127.0.0.1:5001/application-tracker-dashboard/europe-west3";

function toMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function buildParams(arg: SearchExternalJobsArgs): string {
  const sp = new URLSearchParams();
  sp.set("provider", arg.provider);
  sp.set("q", arg.q);

  if (arg.location) sp.set("location", arg.location);
  if (typeof arg.radiusKm === "number" && Number.isFinite(arg.radiusKm)) {
    sp.set("radiusKm", String(arg.radiusKm));
  }
  if (typeof arg.remoteOnly === "boolean") {
    sp.set("remoteOnly", String(arg.remoteOnly));
  }
  if (typeof arg.page === "number" && Number.isFinite(arg.page)) {
    sp.set("page", String(arg.page));
  }

  return sp.toString();
}

async function authedGet(url: string): Promise<Response> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  return fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== "object" || payload === null) return fallback;

  const p = payload as ErrorPayload;

  if (typeof p.error === "string") return p.error;
  if (typeof p.message === "string") return p.message;

  return fallback;
}

export const externalJobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchExternalJobs: builder.query<SearchExternalJobsResp, SearchExternalJobsArgs>({
      async queryFn(arg) {
        try {
          const qs = buildParams(arg);
          const r = await authedGet(`${FUNCTIONS_BASE}/jobSearch?${qs}`);

          if (!r.ok) {
            const payload: unknown = await r.json().catch(() => null);
            const msg = extractErrorMessage(payload, `HTTP ${r.status}`);
            return { error: { message: msg } };
          }

          const data = (await r.json()) as SearchExternalJobsResp;
          return { data };
        } catch (e: unknown) {
          return { error: { message: toMsg(e) } };
        }
      },
    }),
  }),
});

export const { useSearchExternalJobsQuery } = externalJobsApi;
