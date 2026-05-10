import type { StatusKey } from "src/entities/application";

import type { LoopPlatform } from "../../model";

export interface AddMatchFormValues {
  title: string;
  company: string;
  location: string;
  platform: LoopPlatform;
  url: string;
  description: string;
  status: StatusKey;
  matchedAt: string;
}

export interface AddMatchModalLabels {
  addMatch: string;
  addMatchDescription: string;
  cancel: string;
  company: string;
  companyPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  failedToSaveMatch: string;
  jobTitle: string;
  jobTitlePlaceholder: string;
  jobUrl: string;
  jobUrlHint: string;
  jobUrlPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  platform: string;
  saveMatch: string;
  saving: string;
  status: string;
}

export interface AddMatchTextFieldConfig {
  label: string;
  name: "title" | "company" | "location";
  placeholder: string;
}

export interface AddMatchSelectOption<Value extends string> {
  label: string;
  value: Value;
}

