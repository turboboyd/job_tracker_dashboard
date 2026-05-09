import { Timestamp, getDoc, getDocs, query, where } from "firebase/firestore";

import {
  getApplicationGateway,
  type ApplicationDoc,
} from "src/entities/application";
import { userApplicationDoc, userApplicationsCol } from "src/shared/api";
import { db } from "src/shared/config/firebase/firestore";

import type {
  CreateLoopMatchInput,
  LoopMatch,
  UpdateLoopMatchInput,
  UpdateLoopMatchStatusInput,
} from "../model/types";

import {
  cleanPatch,
  mapApplicationToLoopMatch,
  normalizeUrl,
  statusKeyToProcessStatus,
} from "./loopMatchesApi.helpers";
import { buildUpdateMatchDotPatch } from "./loopMatchesApi.patch";
import {
  buildLoopMatches,
  isVisibleLoopMatchApplication,
  sortMatchesByMatchedAt,
} from "./loopMatchesApi.queryHelpers";

export async function getAllMatchesQuery(uid: string): Promise<LoopMatch[]> {
  const snapshot = await getDocs(
    query(userApplicationsCol(uid), where("archived", "==", false)),
  );

  const matches = buildLoopMatches(
    snapshot.docs
      .map((documentSnapshot) => ({
        app: documentSnapshot.data() as ApplicationDoc,
        id: documentSnapshot.id,
      }))
      .filter(({ app }) => isVisibleLoopMatchApplication(app)),
  );

  return sortMatchesByMatchedAt(matches);
}

export async function getMatchesByLoopQuery(
  uid: string,
  loopId: string,
): Promise<LoopMatch[]> {
  const snapshot = await getDocs(
    query(
      userApplicationsCol(uid),
      where("archived", "==", false),
      where("loopLinkage.loopId", "==", loopId),
    ),
  );

  const matches = buildLoopMatches(
    snapshot.docs
      .map((documentSnapshot) => ({
        app: documentSnapshot.data() as ApplicationDoc,
        id: documentSnapshot.id,
      }))
      .filter(({ app }) => isVisibleLoopMatchApplication(app)),
  );

  return sortMatchesByMatchedAt(matches);
}

export async function getMatchByIdQuery(
  uid: string,
  matchId: string,
): Promise<LoopMatch | null> {
  const snapshot = await getDoc(userApplicationDoc(uid, matchId));

  if (!snapshot.exists()) {
    return null;
  }

  const app = snapshot.data() as ApplicationDoc;

  if (!isVisibleLoopMatchApplication(app)) {
    return null;
  }

  return mapApplicationToLoopMatch(snapshot.id, app);
}

export async function createMatchQuery(
  uid: string,
  input: CreateLoopMatchInput,
): Promise<{ id: string }> {
  const { createApplication } = getApplicationGateway();
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
    ...(input.matchedAt ? { loopMatchedAt: new Date(input.matchedAt) } : {}),
    loopSource: "loop",
  });

  return { id };
}

export async function updateMatchStatusQuery(
  uid: string,
  input: UpdateLoopMatchStatusInput,
): Promise<void> {
  const { changeStatus } = getApplicationGateway();
  await changeStatus(db, uid, input.matchId, statusKeyToProcessStatus(input.status));
}

export async function updateMatchQuery(
  uid: string,
  input: UpdateLoopMatchInput,
): Promise<void> {
  const { updateApplicationWithHistory } = getApplicationGateway();
  const cleanedPatch = cleanPatch(input.patch);
  const dotPatch = buildUpdateMatchDotPatch(cleanedPatch);

  await updateApplicationWithHistory(db, uid, input.matchId, dotPatch, () => [
    {
      actor: "user",
      type: "FIELD_CHANGE",
      fieldPath: "legacy.loopMatch",
      oldValue: null,
      newValue: cleanedPatch,
    },
  ]);
}

export async function deleteMatchQuery(uid: string, matchId: string): Promise<void> {
  const { updateApplicationWithHistory } = getApplicationGateway();
  const archivedAt = Timestamp.fromDate(new Date());

  await updateApplicationWithHistory(
    db,
    uid,
    matchId,
    {
      archived: true,
      "process.stage": "ARCHIVED",
      "process.subStatus": "ARCHIVED_GENERAL",
      "process.lastStatusChangeAt": archivedAt,
    },
    (current) => [
      {
        actor: "user",
        type: "FIELD_CHANGE",
        fieldPath: "archived",
        oldValue: current.archived,
        newValue: true,
        comment: "Archived from matches",
      },
    ],
  );
}
