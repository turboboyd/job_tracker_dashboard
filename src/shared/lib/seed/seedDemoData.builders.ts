import { Timestamp } from "firebase/firestore";

import { DEMO_ITEM_SEEDS } from "./demoItemSeeds";
import {
  DEMO_LOOP_FILTERS,
  DEMO_LOOP_NAME,
  DEMO_LOOP_TITLES,
  DEMO_SOURCE,
  LOCATION_FRANKFURT,
  PLATFORM_INDEED,
  PLATFORM_LINKEDIN,
  PLATFORM_STEPSTONE,
} from "./seedDemoData.constants";
import type { DemoItem, LoopDoc } from "./seedDemoData.types";

export function demoAppId(index: number): string {
  return `demoApp_${String(index + 1).padStart(2, "0")}`;
}

function buildMatchedAt(index: number): string {
  const matchedDate = new Date(Date.now() - index * 36 * 60 * 60 * 1000);
  return matchedDate.toISOString();
}

function pickStatus(index: number): DemoItem["status"] {
  if (index < 6) return "new";
  if (index < 10) return "saved";
  if (index < 13) return "applied";
  if (index < 16) return "interview";
  if (index < 18) return "offer";
  return "rejected";
}

export function makeLoop(nowIso: string, nowTs: Timestamp): LoopDoc {
  return {
    name: DEMO_LOOP_NAME,
    titles: DEMO_LOOP_TITLES,
    location: LOCATION_FRANKFURT,
    radiusKm: 25,
    remoteMode: "hybrid",
    platforms: [PLATFORM_LINKEDIN, PLATFORM_INDEED, PLATFORM_STEPSTONE],
    filters: DEMO_LOOP_FILTERS,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdAtTs: nowTs,
    updatedAtTs: nowTs,
  };
}

export function makeItems(loopId: string): DemoItem[] {
  return DEMO_ITEM_SEEDS.map((item, index) => ({
    loopId,
    title: item.title,
    company: item.company,
    location: item.location,
    platform: item.platform,
    url: item.url,
    description: item.description,
    status: pickStatus(index),
    matchedAt: buildMatchedAt(index),
  }));
}

function mapToProcess(item: DemoItem): {
  status: string;
  stage: string;
  subStatus: string;
} {
  switch (item.status) {
    case "saved":
    case "new":
      return { status: "SAVED", stage: "ACTIVE", subStatus: "SAVED" };
    case "applied":
      return { status: "APPLIED", stage: "ACTIVE", subStatus: "APPLIED" };
    case "interview":
      return {
        status: "INTERVIEW_1",
        stage: "INTERVIEW",
        subStatus: "HR_CALL_SCHEDULED",
      };
    case "offer":
      return { status: "OFFER", stage: "OFFER", subStatus: "OFFER_RECEIVED" };
    case "rejected":
      return {
        status: "REJECTED",
        stage: "REJECTED",
        subStatus: "REJECTED_PRE_INTERVIEW",
      };
    default:
      return { status: "SAVED", stage: "ACTIVE", subStatus: "SAVED" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildLoopLinkage(item: DemoItem) {
  return {
    loopId: item.loopId,
    platform: item.platform,
    matchedAt: Timestamp.fromDate(new Date(item.matchedAt)),
    source: DEMO_SOURCE,
  };
}

export function buildDemoAppBackfill(item: DemoItem) {
  return {
    archived: false,
    loopLinkage: buildLoopLinkage(item),
    hasLoop: true,
  };
}

export function buildDemoApplication(
  item: DemoItem,
  uid: string,
  nowTs: Timestamp,
) {
  const process = mapToProcess(item);

  return {
    createdAt: nowTs,
    updatedAt: nowTs,
    createdBy: uid,
    archived: false,
    job: {
      companyName: item.company,
      roleTitle: item.title,
      locationText: item.location,
      vacancyUrl: item.url,
      source: item.platform,
    },
    process: {
      status: process.status,
      stage: process.stage,
      subStatus: process.subStatus,
      lastStatusChangeAt: nowTs,
      contactAttempts: 0,
      followUpLevel: 0,
      needsFollowUp: false,
      needsReapplySuggestion: false,
    },
    notes: { currentNote: "", tags: [] },
    vacancy: { rawDescription: item.description },
    loopLinkage: buildLoopLinkage(item),
    hasLoop: true,
  };
}

export function needsDemoAppBackfill(data: unknown): boolean {
  if (!isRecord(data)) return true;

  const linkage = isRecord(data.loopLinkage) ? data.loopLinkage : null;
  const hasLoopId =
    typeof linkage?.loopId === "string" && linkage.loopId.trim().length > 0;

  return (
    typeof data.archived !== "boolean" ||
    !hasLoopId ||
    data.hasLoop !== true
  );
}
