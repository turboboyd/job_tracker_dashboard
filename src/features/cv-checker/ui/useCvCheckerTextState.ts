import { useCallback, useMemo, useState } from "react";

import { atsScoreCvVsJd } from "src/shared/lib/cvScoring";

import {
  MIN_ANALYZE_TEXT_LENGTH,
  type AtsResult,
  type TextTarget,
} from "./cvChecker.helpers";

export function useCvCheckerTextState() {
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);

  const textStats = useMemo(
    () => ({
      cvLen: cvText.trim().length,
      jdLen: jdText.trim().length,
    }),
    [cvText, jdText],
  );

  const canAnalyze =
    textStats.cvLen >= MIN_ANALYZE_TEXT_LENGTH &&
    textStats.jdLen >= MIN_ANALYZE_TEXT_LENGTH;

  const applyText = useCallback((target: TextTarget, nextText: string) => {
    if (target === "cv") {
      setCvText(nextText);
    } else {
      setJdText(nextText);
    }

    setResult(null);
  }, []);

  const updateCvText = useCallback(
    (nextText: string) => applyText("cv", nextText),
    [applyText],
  );

  const updateJdText = useCallback(
    (nextText: string) => applyText("jd", nextText),
    [applyText],
  );

  const updateJdUrl = useCallback((nextUrl: string) => {
    setJdUrl(nextUrl);
  }, []);

  const analyze = useCallback((): void => {
    if (!canAnalyze) return;
    setResult(atsScoreCvVsJd(cvText, jdText));
  }, [canAnalyze, cvText, jdText]);

  return {
    analyze,
    applyText,
    canAnalyze,
    cvText,
    jdText,
    jdUrl,
    result,
    textStats,
    updateCvText,
    updateJdText,
    updateJdUrl,
  };
}
