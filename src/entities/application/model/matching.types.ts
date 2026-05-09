import type { Timestamp } from "firebase/firestore";

export interface MatchingBreakdown {
  skills: number;
  experience: number;
  language: number;
  location: number;
  domain: number;
  salary: number;
}

export type MatchingDecision = "match" | "maybe" | "skip";

export interface MatchingBlock {
  decision: MatchingDecision;
  score: number;
  breakdown: MatchingBreakdown;
  hardFilterFlags: Record<string, boolean>;
  matchedSkillsTop: string[];
  gapsTop: string[];
  computedAt: Timestamp;
  confidence: number;
}

export interface PriorityBlock {
  score: number;
  reasons: string[];
  computedAt: Timestamp;
}
