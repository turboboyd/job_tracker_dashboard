import type { LoopPlatform } from "../model";

/**
 * Lightweight URL classifier.
 *
 * SonarJS previously flagged the old implementation for high cognitive complexity
 * due to a long chain of if/else statements. The table-driven approach below is
 * easier to maintain and keeps complexity low.
 */
const HOST_RULES: Array<{ needle: string; platform: LoopPlatform }> = [
  { needle: "linkedin.com", platform: "linkedin" },
  { needle: "indeed.", platform: "indeed" },
  { needle: "glassdoor.", platform: "glassdoor" },
  { needle: "monster.", platform: "monster" },
  { needle: "stepstone.", platform: "stepstone" },
  { needle: "xing.", platform: "xing" },
  { needle: "github.com", platform: "github" },
  { needle: "wellfound.", platform: "wellfound" },
  { needle: "angel.co", platform: "wellfound" },
  { needle: "levels.fyi", platform: "levels" },
];

export function detectPlatformFromUrl(url: string | null | undefined): LoopPlatform {
  if (!url) return "other";

  let host = "";
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    // Not a valid URL (e.g. user pasted a partial string)
    return "other";
  }

  for (const rule of HOST_RULES) {
    if (host.includes(rule.needle)) return rule.platform;
  }

  return "other";
}
