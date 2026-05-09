import React, { useState } from "react";

import { classNames } from "src/shared/lib";

import { Button } from "../Button/Button";
import { Card } from "../Card/Card";

interface Props {
  icon: React.ReactNode;
  title: string;
  onGo: () => void;
  done?: boolean;
  goText?: string;
  doneText?: string;
  className?: string;
  iconShake?: boolean;
  onGoHoverChange?: (hovered: boolean) => void;
}

export function ActionRow({
  icon,
  title,
  onGo,
  done = false,
  goText,
  doneText,
  className,
  iconShake = false,
  onGoHoverChange,
}: Props) {
  const [localHover, setLocalHover] = useState(false);
  const hovered = onGoHoverChange ? false : localHover;
  const shouldShake = iconShake || hovered;

  const setGoHover = (nextHovered: boolean) => {
    if (onGoHoverChange) {
      onGoHoverChange(nextHovered);
      return;
    }
    setLocalHover(nextHovered);
  };

  return (
    <Card
      variant="default"
      padding="none"
      interactive
      className={classNames(
        "px-4 py-3",
        "flex items-center justify-between gap-3",
        done && "opacity-60",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="shrink-0 text-primary transition-transform duration-150 ease-in-out"
          style={{
            transform: shouldShake ? "rotate(-8deg) translateX(-1px)" : "none",
            transformOrigin: "50% 50%",
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className={classNames(
            "truncate text-sm font-medium leading-normal",
            done ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {title}
          </div>
        </div>
      </div>

      <Button
        variant={done ? "ghost" : "link"}
        size="sm"
        onClick={onGo}
        disabled={done}
        className={classNames(
          "shrink-0 px-0 text-xs",
          done ? "text-muted-foreground cursor-default" : "text-primary hover:text-primary/80"
        )}
        onMouseEnter={() => setGoHover(true)}
        onMouseLeave={() => setGoHover(false)}
        onFocus={() => setGoHover(true)}
        onBlur={() => setGoHover(false)}
      >
        {done ? (doneText ?? "Done") : (goText ?? "Go →")}
      </Button>
    </Card>
  );
}
