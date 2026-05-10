import type { Timestamp } from "firebase/firestore";

import type { RemotePreference } from "./primitive.types";

export interface UserSkill {
  key: string;
  label: string;
  level: number;
  years?: number;
  lastUsedAt?: Timestamp;
  evidence?: {
    type: "PROJECT" | "COURSE" | "LINK";
    title: string;
    url?: string;
    from?: string;
  }[];
}

export interface UserDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile: {
    fullName?: string;
    location?: { country?: string; city?: string; timezone?: string };
    workAuthorization?: { hasWorkPermit?: boolean; permitType?: string };
    languages?: { de?: string; en?: string };
    salaryExpectation?: { currency?: string; min?: number; max?: number };
    roleTargets?: string[];
    remotePreference?: RemotePreference;
  };
  skills: UserSkill[];
  matchSettings: {
    weights: {
      skills: number;
      experience: number;
      language: number;
      location: number;
      domain: number;
      salary: number;
    };
    hardFilters: {
      minGermanLevel?: string;
      allowOnSite: boolean;
      allowHybrid: boolean;
      allowRemote: boolean;
    };
    skillSynonymsVersion: number;
  };
}
