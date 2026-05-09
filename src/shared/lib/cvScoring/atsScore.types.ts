export type AtsDecision = "APPLY" | "MAYBE" | "SKIP";

export interface AtsResult {
  breakdown: {
    experience: number;
    keywords: number;
    redFlags: number;
    skills: number;
  };
  confidence: number;
  decision: AtsDecision;
  evidence: {
    cvSeniority: string;
    cvSkills: string[];
    cvYears?: number;
    jdSeniority: string;
    jdSkills: string[];
    jdYears?: number;
    keywordCoverage: number;
  };
  gapsTop: {
    effort: number;
    impact: number;
    key: string;
    label: string;
    priority: number;
    reason: string;
  }[];
  hardFilterFlags: string[];
  matchedSkills: string[];
  missingSkills: string[];
  score: number;
}
