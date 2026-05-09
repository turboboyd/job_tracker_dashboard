export interface ImportFormValues {
  language: string;
  nativeLanguage: string;
  level: string;
  stage: string;
  topic: string;
  dryRun: boolean;
  rowsText: string;
}

export interface ImportItemPayload extends Record<string, unknown> {
  word: string;
  translation: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  language: string;
  nativeLanguage: string;
  level: string;
  stage: string;
  topic: string;
}

function normalizeCell(value: string | undefined): string {
  return (value ?? '').trim();
}

export function buildImportItems(values: ImportFormValues): ImportItemPayload[] {
  const language = normalizeCell(values.language);
  const nativeLanguage = normalizeCell(values.nativeLanguage);
  const level = normalizeCell(values.level);
  const stage = normalizeCell(values.stage);
  const topic = normalizeCell(values.topic);

  return values.rowsText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [wordRaw, translationRaw, exampleSentenceRaw, exampleTranslationRaw] = row.split('\t');
      const item: ImportItemPayload = {
        word: normalizeCell(wordRaw),
        translation: normalizeCell(translationRaw),
        language,
        nativeLanguage,
        level,
        stage,
        topic,
      };

      const exampleSentence = normalizeCell(exampleSentenceRaw);
      if (exampleSentence) {
        item.exampleSentence = exampleSentence;
      }

      const exampleTranslation = normalizeCell(exampleTranslationRaw);
      if (exampleTranslation) {
        item.exampleTranslation = exampleTranslation;
      }

      return item;
    })
    .filter((item) => item.word.length > 0 && item.translation.length > 0);
}
