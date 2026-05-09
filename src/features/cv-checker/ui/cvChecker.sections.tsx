import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import { SectionHint } from "./cvChecker.primitives";
export { ScheduleStateMessage } from "./cvChecker.primitives";
export { ResultView } from "./cvChecker.results";
export { CvTextCard, JdTextCard } from "./cvChecker.textCards";
import type { CvCheckerText } from "./cvChecker.text";

export function ResultPlaceholder({ text }: { text: string }) {
  return (
    <Card className="p-4">
      <SectionHint>{text}</SectionHint>
    </Card>
  );
}

export function CvCheckerHeader({ text }: { text: CvCheckerText }) {
  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold text-foreground">
        {text.headerTitle}
      </div>
      <SectionHint>{text.headerSubtitle}</SectionHint>
    </div>
  );
}

export function AnalyzeBar({
  canAnalyze,
  isLoading,
  onAnalyze,
  text,
}: {
  canAnalyze: boolean;
  isLoading: boolean;
  onAnalyze: () => void;
  text: CvCheckerText;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="text-xs text-muted-foreground">
        {canAnalyze ? text.ready : text.notReady}
      </div>

      <Button
        variant="default"
        disabled={!canAnalyze || isLoading}
        onClick={onAnalyze}
      >
        {text.analyze}
      </Button>
    </div>
  );
}
