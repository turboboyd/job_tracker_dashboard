import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  AnalyzeBar,
  CvCheckerHeader,
  CvTextCard,
  JdTextCard,
  ResultPlaceholder,
  ResultView,
  ScheduleStateMessage,
} from "./cvChecker.sections";
import { createCvCheckerText } from "./cvChecker.text";
import { useCvCheckerController } from "./useCvCheckerController";

export function CvCheckerPage() {
  const { t } = useTranslation();
  const text = useMemo(() => createCvCheckerText(t), [t]);
  const {
    analyze,
    bookmarkletUrl,
    canAnalyze,
    copyBookmarklet,
    cvText,
    extractFromUrl,
    jdText,
    jdUrl,
    loadState,
    pasteFromClipboard,
    pickPdf,
    result,
    textStats,
    updateCvText,
    updateJdText,
    updateJdUrl,
  } = useCvCheckerController();

  return (
    <div className="w-full p-4">
      <CvCheckerHeader text={text} />

      <ScheduleStateMessage state={loadState} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CvTextCard
          cvLength={textStats.cvLen}
          cvText={cvText}
          loadState={loadState}
          onCvTextChange={updateCvText}
          onPickPdf={pickPdf}
          text={text}
        />

        <JdTextCard
          bookmarkletUrl={bookmarkletUrl}
          jdLength={textStats.jdLen}
          jdText={jdText}
          jdUrl={jdUrl}
          loadState={loadState}
          onCopyBookmarklet={copyBookmarklet}
          onExtractFromUrl={extractFromUrl}
          onJdTextChange={updateJdText}
          onJdUrlChange={updateJdUrl}
          onPasteFromClipboard={pasteFromClipboard}
          onPickPdf={pickPdf}
          text={text}
        />
      </div>

      <AnalyzeBar
        canAnalyze={canAnalyze}
        isLoading={loadState.kind === "loading"}
        onAnalyze={analyze}
        text={text}
      />

      <div className="mt-4">
        {result ? (
          <ResultView result={result} text={text} />
        ) : (
          <ResultPlaceholder text={text.noResult} />
        )}
      </div>
    </div>
  );
}

export default CvCheckerPage;
