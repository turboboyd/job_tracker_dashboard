import type { LoopPlatform } from "src/entities/loop/model";

export type LoopMatchStatus =
  | "new"
  | "saved"
  | "interview"
  | "offer"
  | "applied"
  | "rejected";

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
