import type { Timestamp } from "firebase/firestore";

export interface LoopDoc {
  name: string;
  titles: string[];
  location: string;
  radiusKm: number;
  remoteMode: string;
  platforms: string[];
  filters?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdAtTs: Timestamp;
  updatedAtTs: Timestamp;
}

export interface DemoItem {
  loopId: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  url: string;
  description: string;
  status: "new" | "saved" | "applied" | "interview" | "offer" | "rejected";
  matchedAt: string;
}

export interface DemoSeedEntry {
  appId: string;
  item: DemoItem;
}

export interface DemoAppAuditResult {
  backfill: DemoSeedEntry[];
  missing: DemoSeedEntry[];
}

export interface DemoItemSeed {
  title: string;
  company: string;
  location: string;
  platform: string;
  url: string;
  description: string;
}
