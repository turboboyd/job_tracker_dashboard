import { useCallback, useMemo } from "react";

import { buildJdBookmarklet, fetchJdFromUrl } from "src/shared/lib/jd";
import { extractTextFromPdf } from "src/shared/lib/pdf";

import {
  BOOKMARKLET_INFO_RESET_DELAY_MS,
  INFO_RESET_DELAY_MS,
  MIN_ANALYZE_TEXT_LENGTH,
  MIN_EXTRACTED_PDF_TEXT_LENGTH,
  getBookmarkletCopiedMessage,
  getBookmarkletCopyErrorMessage,
  getClipboardErrorMessage,
  getClipboardSuccessMessage,
  getClipboardTextTooShortMessage,
  getJdUrlRequiredMessage,
  getPdfErrorMessage,
  getPdfRequiredMessage,
  getPdfTextTooShortMessage,
  getUrlExtractedMessage,
  isPdfFile,
  type TextTarget,
} from "./cvChecker.helpers";
import { useCvCheckerLoadState } from "./useCvCheckerLoadState";
import { useCvCheckerTextState } from "./useCvCheckerTextState";

export function useCvCheckerController() {
  const textState = useCvCheckerTextState();
  const {
    loadState,
    setErrorState,
    setIdleState,
    setInfoState,
    setLoadingState,
  } = useCvCheckerLoadState();

  const bookmarkletUrl = useMemo(() => buildJdBookmarklet(), []);

  const pickPdf = useCallback(
    async (which: TextTarget, file: File | null): Promise<void> => {
      if (!file) return;

      if (!isPdfFile(file)) {
        setErrorState(getPdfRequiredMessage());
        return;
      }

      try {
        setLoadingState(which);
        const text = await extractTextFromPdf(file);

        if (text.trim().length < MIN_EXTRACTED_PDF_TEXT_LENGTH) {
          setErrorState(getPdfTextTooShortMessage());
          return;
        }

        textState.applyText(which, text);
        setIdleState();
      } catch (error: unknown) {
        setErrorState(getPdfErrorMessage(error));
      }
    },
    [setErrorState, setIdleState, setLoadingState, textState],
  );

  const pasteFromClipboard = useCallback(async (): Promise<void> => {
    try {
      setLoadingState("clipboard");
      const text = await navigator.clipboard.readText();
      const trimmedLength = text.trim().length;

      if (trimmedLength < MIN_ANALYZE_TEXT_LENGTH) {
        setErrorState(getClipboardTextTooShortMessage());
        return;
      }

      textState.applyText("jd", text);
      setInfoState(
        getClipboardSuccessMessage(trimmedLength),
        INFO_RESET_DELAY_MS,
      );
    } catch (error: unknown) {
      setErrorState(getClipboardErrorMessage(error));
    }
  }, [setErrorState, setInfoState, setLoadingState, textState]);

  const extractFromUrl = useCallback(async (): Promise<void> => {
    const url = textState.jdUrl.trim();

    if (!url) {
      setErrorState(getJdUrlRequiredMessage());
      return;
    }

    try {
      setLoadingState("url");
      const response = await fetchJdFromUrl(url);

      if (!response.ok) {
        setErrorState(response.message);
        return;
      }

      textState.applyText("jd", response.text);
      setInfoState(
        getUrlExtractedMessage(response.text.length),
        INFO_RESET_DELAY_MS,
      );
    } catch (error: unknown) {
      setErrorState(getClipboardErrorMessage(error));
    }
  }, [setErrorState, setInfoState, setLoadingState, textState]);

  const copyBookmarklet = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(bookmarkletUrl);
      setInfoState(
        getBookmarkletCopiedMessage(),
        BOOKMARKLET_INFO_RESET_DELAY_MS,
      );
    } catch {
      setErrorState(getBookmarkletCopyErrorMessage());
    }
  }, [bookmarkletUrl, setErrorState, setInfoState]);

  return {
    analyze: textState.analyze,
    bookmarkletUrl,
    canAnalyze: textState.canAnalyze,
    copyBookmarklet,
    cvText: textState.cvText,
    extractFromUrl,
    jdText: textState.jdText,
    jdUrl: textState.jdUrl,
    loadState,
    pasteFromClipboard,
    pickPdf,
    result: textState.result,
    textStats: textState.textStats,
    updateCvText: textState.updateCvText,
    updateJdText: textState.updateJdText,
    updateJdUrl: textState.updateJdUrl,
  };
}
