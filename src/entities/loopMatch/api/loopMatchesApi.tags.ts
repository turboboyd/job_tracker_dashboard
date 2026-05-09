import type { LoopMatch } from "../model/types";

function createLoopMatchTag(id: string) {
  return { type: "LoopMatches" as const, id };
}

export function provideAllLoopMatchesTags(matches: LoopMatch[] | undefined) {
  return [
    ...(matches?.map((match) => createLoopMatchTag(match.id)) ?? []),
    createLoopMatchTag("LIST:ALL"),
  ];
}

export function provideLoopMatchesByLoopTags(loopId: string) {
  return [createLoopMatchTag(`LIST:LOOP:${loopId}`)];
}

export function provideLoopMatchTags(matchId: string) {
  return [createLoopMatchTag(matchId)];
}

export function invalidateLoopMatchesByLoopTags(loopId: string) {
  return [
    createLoopMatchTag("LIST:ALL"),
    createLoopMatchTag(`LIST:LOOP:${loopId}`),
  ];
}

export function invalidateLoopMatchEntityTags(matchId: string, loopId?: string) {
  return [
    createLoopMatchTag(matchId),
    createLoopMatchTag("LIST:ALL"),
    ...(loopId ? [createLoopMatchTag(`LIST:LOOP:${loopId}`)] : []),
  ];
}
