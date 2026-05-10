import * as Yup from "yup";

export const IMPORT_SCHEMA = Yup.object({
  language: Yup.string().trim().min(2).required("Enter the source language."),
  nativeLanguage: Yup.string()
    .trim()
    .min(2)
    .required("Enter the translation language."),
  level: Yup.string().trim().required("Select a level."),
  stage: Yup.string().trim().required("Enter a stage."),
  topic: Yup.string().trim().required("Enter a topic."),
  rowsText: Yup.string().test(
    "rows-present",
    "Add at least one TSV row.",
    (value) => Boolean(value?.trim()),
  ),
});

