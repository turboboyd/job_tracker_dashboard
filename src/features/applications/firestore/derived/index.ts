import type { Timestamp } from "firebase/firestore";

import type { ApplicationDoc, UserDoc } from "../documents.types";
import type { MatchingBlock, PriorityBlock } from "../domain.types";
import type { DotPatch } from "../patch.types";

import { computeRoleFingerprint, withRoleFingerprint } from "./fingerprint";
import { computeFollowUp } from "./followUp";
import { computeMatching } from "./matching";
import { computePriority } from "./priority";
import { computeReapply } from "./reapply";

export interface DerivedComputation {
  roleFingerprint: string;
  matching?: MatchingBlock;
  followUp: {
    needsFollowUp: boolean;
    followUpDueAt?: Timestamp;
    followUpLevel: number;
  };
  reapply: {
    needsReapplySuggestion: boolean;
    reapplyEligibleAt?: Timestamp;
    reapplyReason?: string;
  };
  priority: PriorityBlock;
}

export function computeDerived(
  user: UserDoc | null,
  app: ApplicationDoc,
  t: Timestamp,
): DerivedComputation {
  const roleFingerprint = app.vacancy?.roleFingerprint ?? computeRoleFingerprint(app);

  const base = withRoleFingerprint(app, roleFingerprint);
  const matching = computeMatching(user, base, t);
  const withMatching = matching ? { matching } : {};

  const followUp = computeFollowUp({ ...base, ...withMatching }, t);
  const reapply = computeReapply(
    {
      ...base,
      ...withMatching,
      process: { ...base.process, ...followUp },
    },
    t,
  );

  const withDerived: ApplicationDoc = {
    ...base,
    ...withMatching,
    process: { ...base.process, ...followUp, ...reapply },
  };
  const priority = computePriority(withDerived, t);

  return {
    roleFingerprint,
    ...(matching ? { matching } : {}),
    followUp,
    reapply,
    priority,
  };
}

export function buildDerivedPatch(d: DerivedComputation): DotPatch {
  return {
    "vacancy.roleFingerprint": d.roleFingerprint,
    matching: d.matching,
    priority: d.priority,
    "process.needsFollowUp": d.followUp.needsFollowUp,
    "process.followUpDueAt": d.followUp.followUpDueAt,
    "process.followUpLevel": d.followUp.followUpLevel,
    "process.needsReapplySuggestion": d.reapply.needsReapplySuggestion,
    "process.reapplyEligibleAt": d.reapply.reapplyEligibleAt,
    "process.reapplyReason": d.reapply.reapplyReason,
  };
}

export { withRoleFingerprint };
