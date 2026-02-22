import { ResourceCategory } from "./types";

export const CATEGORY_ORDER: Exclude<ResourceCategory, "all">[] = [
  "cv",
  "interview",
  "jobBoards",
  "learning",
  "productivity",
];

export const categoryLabelKey: Record<ResourceCategory, string> = {
  all: "categories.all",
  cv: "categories.cv",
  interview: "categories.interview",
  jobBoards: "categories.jobBoards",
  learning: "categories.learning",
  productivity: "categories.productivity",
};
