import { Card } from "src/shared/ui/Card";

import { BookmarkletPanel } from "./cvChecker.bookmarkletPanel";
import type { LoadState, TextTarget } from "./cvChecker.helpers";
import { JdUrlInputRow } from "./cvChecker.jdUrlInputRow";
import {
  EditorArea,
  FieldLength,
  SectionTitle,
  UploadPdfLabel,
} from "./cvChecker.primitives";
import type { CvCheckerText } from "./cvChecker.text";

export function CvTextCard({
  cvLength,
  cvText,
  loadState,
  onCvTextChange,
  onPickPdf,
  text,
}: {
  cvLength: number;
  cvText: string;
  loadState: LoadState;
  onCvTextChange: (nextText: string) => void;
  onPickPdf: (which: TextTarget, file: File | null) => Promise<void>;
  text: CvCheckerText;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{text.cvLabel}</SectionTitle>
        <UploadPdfLabel
          isLoading={loadState.kind === "loading" && loadState.which === "cv"}
          onPickPdf={onPickPdf}
          target="cv"
          text={text}
        />
      </div>

      <EditorArea
        heightClassName="h-64"
        onChange={onCvTextChange}
        placeholder={text.cvPlaceholder}
        value={cvText}
      />

      <FieldLength label={text.textLength} value={cvLength} />
    </Card>
  );
}

export function JdTextCard({
  bookmarkletUrl,
  jdLength,
  jdText,
  jdUrl,
  loadState,
  onCopyBookmarklet,
  onExtractFromUrl,
  onJdTextChange,
  onJdUrlChange,
  onPasteFromClipboard,
  onPickPdf,
  text,
}: {
  bookmarkletUrl: string;
  jdLength: number;
  jdText: string;
  jdUrl: string;
  loadState: LoadState;
  onCopyBookmarklet: () => Promise<void>;
  onExtractFromUrl: () => Promise<void>;
  onJdTextChange: (nextText: string) => void;
  onJdUrlChange: (nextUrl: string) => void;
  onPasteFromClipboard: () => Promise<void>;
  onPickPdf: (which: TextTarget, file: File | null) => Promise<void>;
  text: CvCheckerText;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{text.jdLabel}</SectionTitle>
        <UploadPdfLabel
          isLoading={loadState.kind === "loading" && loadState.which === "jd"}
          onPickPdf={onPickPdf}
          target="jd"
          text={text}
        />
      </div>

      <JdUrlInputRow
        jdUrl={jdUrl}
        loadState={loadState}
        onExtractFromUrl={onExtractFromUrl}
        onJdUrlChange={onJdUrlChange}
        text={text}
      />

      <BookmarkletPanel
        bookmarkletUrl={bookmarkletUrl}
        loadState={loadState}
        onCopyBookmarklet={onCopyBookmarklet}
        onPasteFromClipboard={onPasteFromClipboard}
        text={text}
      />

      <EditorArea
        heightClassName="h-56"
        onChange={onJdTextChange}
        placeholder={text.jdPlaceholder}
        value={jdText}
      />

      <FieldLength label={text.textLength} value={jdLength} />
    </Card>
  );
}
