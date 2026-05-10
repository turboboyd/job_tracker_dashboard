import { Button } from "src/shared/ui/Button";

import type { LoadState } from "./cvChecker.helpers";
import { INPUT_CLASS } from "./cvChecker.primitives";
import type { CvCheckerText } from "./cvChecker.text";

interface JdUrlInputRowProps {
  jdUrl: string;
  loadState: LoadState;
  onExtractFromUrl: () => Promise<void>;
  onJdUrlChange: (nextUrl: string) => void;
  text: CvCheckerText;
}

export function JdUrlInputRow({
  jdUrl,
  loadState,
  onExtractFromUrl,
  onJdUrlChange,
  text,
}: JdUrlInputRowProps) {
  const isUrlLoading = loadState.kind === "loading" && loadState.which === "url";

  return (
    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
      <input
        className={INPUT_CLASS}
        placeholder={text.jdUrlPlaceholder}
        value={jdUrl}
        onChange={(event) => onJdUrlChange(event.target.value)}
      />
      <Button
        variant="default"
        disabled={loadState.kind === "loading"}
        onClick={() => void onExtractFromUrl()}
      >
        {isUrlLoading ? text.extractingFromUrl : text.extractFromUrl}
      </Button>
    </div>
  );
}
