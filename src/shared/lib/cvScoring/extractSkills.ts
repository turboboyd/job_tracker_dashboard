import { extractSkills as extract } from "./extract";

export function extractSkills(text: string): string[] {
  return extract(text);
}
