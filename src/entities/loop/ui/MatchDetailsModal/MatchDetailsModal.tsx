import React, { useMemo } from "react";

import { Button } from "src/shared/ui";

import { PLATFORM_LABEL_BY_ID } from "../../model";
import type { LoopPlatform } from "../../model";

export type ActiveLink = { platform: LoopPlatform; url: string } | null;

type Props = {
  activeLink: ActiveLink;

  onAddMatch: (platform: LoopPlatform) => void;
  onClear?: () => void;

  disabled?: boolean;
};

export function OutboundApplyBar({
  activeLink,
  onAddMatch,
  onClear,
  disabled,
}: Props) {
  const label = useMemo(() => {
    if (!activeLink) return "";
    return PLATFORM_LABEL_BY_ID[activeLink.platform] ?? activeLink.platform;
  }, [activeLink]);

  if (!activeLink) return null;

  return (
    <div className="sticky bottom-3 z-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              Opened: {label}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {activeLink.url}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Choose a job on the site → copy URL → click “Add match”.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              shadow="sm"
              shape="lg"
              onClick={() => onAddMatch(activeLink.platform)}
              disabled={disabled}
            >
              Add match
            </Button>

            {onClear ? (
              <Button
                variant="outline"
                shape="lg"
                onClick={onClear}
                disabled={disabled}
              >
                Hide
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
