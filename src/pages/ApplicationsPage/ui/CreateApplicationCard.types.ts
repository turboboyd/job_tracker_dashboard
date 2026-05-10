import type { CreateFormState } from "../model/types";

export interface CreateApplicationLabels {
  company: string;
  companyPlaceholder: string;
  createButton: string;
  creatingButton: string;
  description: string;
  descriptionPlaceholder: string;
  role: string;
  rolePlaceholder: string;
  source: string;
  sourcePlaceholder: string;
  title: string;
  url: string;
  urlPlaceholder: string;
}

export type CreateFormFieldKey = keyof CreateFormState;

export type CreateApplicationChangeHandler = <K extends CreateFormFieldKey>(
  key: K,
  value: CreateFormState[K],
) => void;
