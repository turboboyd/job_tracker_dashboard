import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatCountdownClock } from "./matchesV2.helpers";

interface AutoRefreshCountdownProps {
  /** ISO timestamp of the loop's next scheduled run. */
  targetIso: string | null;
  /** Fired once when the countdown reaches the target moment. */
  onElapsed?: () => void;
}

/**
 * Live "Автообновление через MM:SS" countdown. Owns its own 1s interval so the
 * surrounding page does not re-render every tick. Calls onElapsed exactly once
 * per target when the moment passes.
 */
export function AutoRefreshCountdown({ targetIso, onElapsed }: AutoRefreshCountdownProps) {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const firedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetIso) return undefined;
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [targetIso]);

  useEffect(() => {
    if (!targetIso) return;
    const target = Date.parse(targetIso);
    if (Number.isNaN(target)) return;
    if (nowMs >= target && firedForRef.current !== targetIso) {
      firedForRef.current = targetIso;
      onElapsed?.();
    }
  }, [nowMs, targetIso, onElapsed]);

  const clock = formatCountdownClock(targetIso, nowMs);
  if (!clock) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
      />
      {t("matches.autoRefresh.label", "Auto-refresh in")} <span className="tabular-nums text-muted-foreground">{clock}</span>
    </span>
  );
}
