import type { ImportFormValues } from "../lib/adminContentHelpers";

export const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const LEVEL_SELECT_OPTIONS = LEVEL_OPTIONS.map((item) => ({
  value: item,
  label: item,
}));

export const INITIAL_VALUES: ImportFormValues = {
  language: "en",
  nativeLanguage: "ru",
  level: "A1",
  stage: "A1.1",
  topic: "general",
  dryRun: true,
  rowsText: "",
};

export const TSV_PLACEHOLDER = [
  "word\ttranslation\texample sentence\texample translation",
  "team\tкоманда\tOur team ships weekly\tНаша команда выпускает обновления еженедельно",
].join("\n");

export const IMPORT_SECTION_DESCRIPTION =
  "Paste TSV rows in the format: word TAB translation TAB example sentence TAB example translation. Shared metadata is configured through the form fields below.";

export const DRY_RUN_HINT =
  "Start with dry-run to see which rows are creatable, existing, or skipped.";

export const UNSAVED_DRAFT_MESSAGE =
  "There is an unsaved bulk import draft. It will be lost if you leave the page.";

export const EMPTY_RESULTS_TEXT = "No results yet";
export const EMPTY_REASON_TEXT = "—";

