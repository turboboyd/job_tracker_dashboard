import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";

import { useOnboardingHint } from "../model/useOnboardingHint";

interface OnboardingHintProps {
  /** Stable id — the dismissal is persisted per id (per-device). */
  id: string;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Non-blocking, dismissible contextual hint. Foundation only: copy and placement
 * are supplied by the consumer (via i18n), so this component carries no hardcoded
 * onboarding text. Renders nothing once dismissed.
 */
export function OnboardingHint({ id, title, children, className }: OnboardingHintProps) {
  const { t } = useTranslation();
  const { visible, dismiss } = useOnboardingHint(id);
  if (!visible) return null;

  return (
    <div
      role="status"
      className={classNames(
        "relative rounded-[12px] border border-primary/30 bg-primary/5 p-3.5 pr-9 text-[12.5px]",
        className,
      )}
    >
      {title ? <div className="mb-0.5 font-medium text-foreground">{title}</div> : null}
      <div className="text-muted-foreground">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.close", "Close")}
        title={t("common.close", "Close")}
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
