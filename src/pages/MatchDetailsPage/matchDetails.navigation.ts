import type { Location } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

import type { MatchDetailsLocationState } from "./matchDetails.model";

export function isMatchDetailsLocationState(
  state: unknown,
): state is MatchDetailsLocationState {
  if (typeof state !== "object" || state === null) {
    return false;
  }

  const maybeState = state as { from?: unknown };
  if (maybeState.from === undefined) {
    return true;
  }

  if (typeof maybeState.from !== "object" || maybeState.from === null) {
    return false;
  }

  const maybeFrom = maybeState.from as { pathname?: unknown; search?: unknown };

  return (
    (maybeFrom.pathname === undefined ||
      typeof maybeFrom.pathname === "string") &&
    (maybeFrom.search === undefined || typeof maybeFrom.search === "string")
  );
}

export function getMatchDetailsLocationState(
  location: Location,
): MatchDetailsLocationState | undefined {
  return isMatchDetailsLocationState(location.state) ? location.state : undefined;
}

export function getMatchDetailsBackTo(location: Location): string {
  const from = getMatchDetailsLocationState(location)?.from;
  if (from?.pathname) {
    return `${from.pathname}${from.search ?? ""}`;
  }

  return RoutePath[AppRoutes.MATCHES];
}
