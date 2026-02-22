export type ResourceCategory =
  | "all"
  | "cv"
  | "interview"
  | "jobBoards"
  | "learning"
  | "productivity";

export type ViewMode = "all" | "favorites";

export type ResourceItem = {
  id: string;
  href: string;
  category: Exclude<ResourceCategory, "all">;
  i18nKey: string;
  tagKeys: string[];
};
