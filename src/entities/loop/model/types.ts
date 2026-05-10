export type RemoteMode = "any" | "remote_only";
export type ValidationResult = { ok: true } | { ok: false; message: string };
export const LOOP_PLATFORM_VALUES = [
  "linkedin",
  "indeed",
  "stepstone",
  "xing",
  "arbeitsagentur",
  "jobvector",
  "joblift",
  "kimeta",
  "meinestadt",
  "stellenanzeigen",
  "monster",
  "jobware",
  "gigajob",
  "jooble",
  "adzuna",
  "glassdoor",
  "germantechjobs",
  "honeypot",
  "instaffo",
  "wellfound",
  "getinit",
  "wearedevelopers",
  "devjobs",
  "arbeitnow",
  "remoteok",
  "weworkremotely",
  "remotive",
  "azubide",
  "ausbildungde",
  "azubiyo",
  "praktikuminfo",
  "ihk",
  "github",
  "levels",
  "other",
] as const;

export type LoopPlatform = (typeof LOOP_PLATFORM_VALUES)[number];

export interface Loop {
  id: string;
  name: string;
  titles: string[];
  location: string;
  radiusKm: number;
  filters?: CanonicalFilters;
  remoteMode: RemoteMode;
  platforms: LoopPlatform[];
  createdAtTs?: number | null;
  updatedAtTs?: number | null;
}

export interface CanonicalFilters {
  role: string;

  location: string;
  radiusKm: 5 | 10 | 20 | 30 | 50 | 100;

  workMode: "any" | "onsite" | "hybrid" | "remote" | "remote_only";

  seniority: "intern" | "junior" | "mid" | "senior" | "lead";

  employmentType:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship"
    | "ausbildung";

  postedWithin: 1 | 3 | 7 | 14 | 30;

  includeKeywords: string;
  excludeKeywords: string;

  excludeAgencies: boolean;
  language: "any" | "de" | "en";
}

export type WorkMode = "any" | "remote_only";

export interface SearchFilters {
  role: string;
  location: string;
  radiusKm: number;
  workMode: WorkMode;
}
export type PlatformGroupId = "germany" | "tech" | "remote" | "ausbildung";

export interface PlatformMeta {
  id: LoopPlatform;
  label: string;
  group: "recommended" | PlatformGroupId;
  recommended: boolean;
  buildUrl: (f: SearchFilters) => string;
}
