import { motion } from "framer-motion";
import React, { useState } from "react";

import { classNames } from "src/shared/lib";
import { Button, Card } from "src/shared/ui";

type Props = {
  icon: React.ReactNode;
  title: string;
  onGo: () => void;
  done?: boolean;
  className?: string;
  iconShake?: boolean;
  onGoHoverChange?: (hovered: boolean) => void;
};

export function ActionRow({
  icon,
  title,
  onGo,
  done = false,
  className,
  iconShake = false,
  onGoHoverChange,
}: Props) {
  const [localHover, setLocalHover] = useState(false);
  const hovered = onGoHoverChange ? false : localHover;

  const shouldShake = iconShake || hovered;

  return (
    <Card
      variant="default"
      padding="none"
      interactive
      className={classNames(
        "rounded-xl px-md py-sm",
        "flex items-center justify-between gap-md",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-sm">
        <motion.div
          className="shrink-0 text-foreground"
          animate={
            shouldShake
              ? {
                  rotate: [0, -12, 12, -10, 10, -6, 6, 0],
                  x: [0, -1, 1, -1, 1, 0],
                }
              : { rotate: 0, x: 0 }
          }
          transition={
            shouldShake
              ? {
                  duration: 0.55,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.25,
                }
              : { duration: 0.15 }
          }
          style={{ transformOrigin: "50% 50%" }}
        >
          {icon}
        </motion.div>

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground leading-normal">
            {title}
          </div>
        </div>
      </div>

      <Button
        variant="link"
        onClick={onGo}
        disabled={done}
        className={classNames(
          "px-0",
          "transition-colors duration-fast ease-ease-out",
          done ? "text-muted-foreground" : "text-primary"
        )}
        onMouseEnter={() => {
          if (onGoHoverChange) onGoHoverChange(true);
          else setLocalHover(true);
        }}
        onMouseLeave={() => {
          if (onGoHoverChange) onGoHoverChange(false);
          else setLocalHover(false);
        }}
        onFocus={() => {
          if (onGoHoverChange) onGoHoverChange(true);
          else setLocalHover(true);
        }}
        onBlur={() => {
          if (onGoHoverChange) onGoHoverChange(false);
          else setLocalHover(false);
        }}
      >
        {done ? "Done" : "Go"}
      </Button>
    </Card>
  );
}
