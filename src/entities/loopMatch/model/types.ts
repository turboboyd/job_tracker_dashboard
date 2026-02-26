import type { StatusKey } from "src/entities/application/model/status";
import type { LoopPlatform } from "src/entities/loop/model";

/**
 * Loop matches are represented with the same status system as Applications.
 * No local enums/unions here: use the shared StatusKey from status.ts.
 */
export type LoopMatchStatus = StatusKey;

/**
 * Canonical in-app model for a match.
 *
 * Firestore location: users/{uid}/loopMatches/{matchId}
 * Ownership is guaranteed by document path (no `userId` field required).
 */
export type LoopMatch = {
  id: string;
  loopId: string;

  title: string;
  company: string;
  location: string;

  platform: LoopPlatform;
  url: string;
  description: string;

  status: LoopMatchStatus;
  matchedAt: string;

  createdAt: string;
  updatedAt: string;
};

// -----------------------------
// Inputs for API layer
// -----------------------------

export type CreateLoopMatchInput = Omit<LoopMatch, "id" | "createdAt" | "updatedAt">;

export type UpdateLoopMatchStatusInput = {
  matchId: string;
  loopId: string;
  status: LoopMatchStatus;
};

export type UpdateLoopMatchInput = {
  matchId: string;
  patch: Partial<
    Pick<
      LoopMatch,
      "title" | "company" | "location" | "url" | "description" | "matchedAt" | "platform" | "status"
    >
  >;
};

export type DeleteLoopMatchInput = {
  matchId: string;
  loopId: string;
};
