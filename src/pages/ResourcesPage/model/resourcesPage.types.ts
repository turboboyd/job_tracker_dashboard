import type { ResourceCategory } from "./types";

export interface CategoryOption {
  key: ResourceCategory;
  label: string;
}

export interface LocalizedResource {
  id: string;
  title: string;
  description: string;
  href: string;
  category: Exclude<ResourceCategory, "all">;
  tags: string[];
}

export type ResourcesTranslator = (
  key: string,
  fallback?: string,
  options?: Record<string, unknown>,
) => string;

