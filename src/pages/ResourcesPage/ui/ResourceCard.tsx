import { Star } from "lucide-react";
import React from "react";

import { Button, Card } from "src/shared/ui";

type Props = {
  title: string;
  description: string;
  href: string;
  tags: string[];

  showFavorite: boolean;
  isFav: boolean;
  isPending: boolean;
  ariaLabel: string;
  onToggleFavorite: () => void;

  openLabel: string;
};

export const ResourceCard: React.FC<Props> = ({
  title,
  description,
  href,
  tags,
  showFavorite,
  isFav,
  isPending,
  ariaLabel,
  onToggleFavorite,
  openLabel,
}) => {
  return (
    <Card padding="md" shadow="sm" interactive className="flex flex-col gap-3">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-foreground break-words [hyphens:auto]">
            {title}
          </div>
        </div>

        {showFavorite ? (
          <Button
            variant={isFav ? "default" : "outline"}
            size="icon"
            shadow="none"
            aria-label={ariaLabel}
            disabled={isPending}
            onClick={onToggleFavorite}
            className={[
              "shrink-0",
              isPending ? "opacity-70 pointer-events-none" : "",
            ].join(" ")}
          >
            <Star className={isFav ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          </Button>
        ) : null}
      </div>

      <div className="mt-1 text-sm text-muted-foreground">{description}</div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={`${href}:${tag}`}
            className="inline-flex items-center rounded-full bg-muted px-sm py-1 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {openLabel}
          <span aria-hidden className="text-muted-foreground">
            ↗
          </span>
        </a>
      </div>
    </Card>
  );
};
