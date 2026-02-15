
import { Button } from "src/shared/ui";

type Props = {
  count: number;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function OutboundApplyBar({ count, onApply, onClear, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{count}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          shadow="sm"
          shape="lg"
          disabled={disabled || count === 0}
          onClick={onApply}
        >
          Apply (open links)
        </Button>

        <Button variant="outline" shape="lg" disabled={disabled || count === 0} onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="w-full text-xs text-muted-foreground">
        Tip: browsers may block too many popups. Open 3–8 at a time.
      </div>
    </div>
  );
}
