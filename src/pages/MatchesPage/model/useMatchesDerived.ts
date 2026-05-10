import React from "react";

import {
  buildLoopIdToName,
  buildPlatformOptions,
  buildStatusOptions,
} from "./matchesViewModel";

interface MatchLike {
  platform?: unknown;
  status?: unknown;
  loopId: string;
}

interface LoopLike {
  id: string;
  name: string;
}

export function useMatchesDerived(matches: MatchLike[], loops: LoopLike[]) {
  const loopIdToName = React.useMemo(() => buildLoopIdToName(loops), [loops]);
  const platformOptions = React.useMemo(() => buildPlatformOptions(matches), [matches]);
  const statusOptions = React.useMemo(() => buildStatusOptions(matches), [matches]);

  return { loopIdToName, platformOptions, statusOptions };
}
