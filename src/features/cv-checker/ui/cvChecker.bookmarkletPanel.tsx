import { Button } from "src/shared/ui/Button";

import type { LoadState } from "./cvChecker.helpers";
import {
  INPUT_CLASS,
  MUTED_PANEL_CLASS,
} from "./cvChecker.primitives";
import type { CvCheckerText } from "./cvChecker.text";

interface BookmarkletPanelProps {
  bookmarkletUrl: string;
  loadState: LoadState;
  onCopyBookmarklet: () => Promise<void>;
  onPasteFromClipboard: () => Promise<void>;
  text: CvCheckerText;
}

export function BookmarkletPanel({
  bookmarkletUrl,
  loadState,
  onCopyBookmarklet,
  onPasteFromClipboard,
  text,
}: BookmarkletPanelProps) {
  return (
    <div className={`mt-3 ${MUTED_PANEL_CLASS}`}>
      <div className="text-xs font-medium text-foreground">
        {text.bookmarkletTitle}
      </div>

      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
        {text.bookmarkletSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
        <input className={INPUT_CLASS} value={bookmarkletUrl} readOnly />
        <Button
          variant="default"
          disabled={loadState.kind === "loading"}
          onClick={() => void onCopyBookmarklet()}
        >
          {text.bookmarkletCopy}
        </Button>
        <Button
          variant="default"
          disabled={loadState.kind === "loading"}
          onClick={() => void onPasteFromClipboard()}
        >
          {loadState.kind === "loading" && loadState.which === "clipboard"
            ? text.bookmarkletReadingClipboard
            : text.bookmarkletCopiedAction}
        </Button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {text.bookmarkletCorsHint}
      </div>
    </div>
  );
}
