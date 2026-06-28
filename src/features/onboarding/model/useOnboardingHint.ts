import { useCallback, useState } from "react";

import { dismissHint, isHintDismissed } from "./onboardingState";

export interface UseOnboardingHintResult {
  visible: boolean;
  dismiss: () => void;
}

/**
 * Foundation for one-time contextual hints. A hint is visible until dismissed;
 * the dismissal is persisted per `id` (per-device). Non-blocking by design —
 * the consumer decides where/whether to render `OnboardingHint`.
 */
export function useOnboardingHint(id: string): UseOnboardingHintResult {
  const [dismissed, setDismissed] = useState(() => isHintDismissed(id));

  const dismiss = useCallback(() => {
    dismissHint(id);
    setDismissed(true);
  }, [id]);

  return { visible: !dismissed, dismiss };
}
