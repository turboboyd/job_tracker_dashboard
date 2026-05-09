import { Button, Card } from "src/shared/ui";

import type { LocalizedResource } from "./model/useResourcesPage";
import { ResourceCard } from "./ui/ResourceCard";

interface ResourcesFavoritesErrorProps {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}

interface ResourcesListProps {
  filtered: LocalizedResource[];
  isFavorite: (resourceId: string) => boolean;
  isPending: (resourceId: string) => boolean;
  isPrivate: boolean;
  onToggleFavorite: (resourceId: string) => void | Promise<void>;
  openLabel: string;
  saveLabel: string;
  uid: string | null | undefined;
  unsaveLabel: string;
}

interface ResourcesEmptyStateProps {
  message: string;
}

export function ResourcesFavoritesError({
  message,
  onRetry,
  retryLabel,
}: ResourcesFavoritesErrorProps) {
  return (
    <Card padding="md" shadow="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-destructive">{message}</div>
        <Button
          variant="outline"
          size="sm"
          shadow="none"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      </div>
    </Card>
  );
}

export function ResourcesList({
  filtered,
  isFavorite,
  isPending,
  isPrivate,
  onToggleFavorite,
  openLabel,
  saveLabel,
  uid,
  unsaveLabel,
}: ResourcesListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((resource) => {
        const isFav = isFavorite(resource.id);
        const pending = isPending(resource.id);

        return (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            description={resource.description}
            href={resource.href}
            tags={resource.tags}
            showFavorite={isPrivate}
            isFav={isFav}
            isPending={!uid || pending}
            ariaLabel={isFav ? unsaveLabel : saveLabel}
            onToggleFavorite={() => onToggleFavorite(resource.id)}
            openLabel={openLabel}
          />
        );
      })}
    </div>
  );
}

export function ResourcesEmptyState({ message }: ResourcesEmptyStateProps) {
  return (
    <Card padding="md" shadow="sm">
      <div className="text-sm text-muted-foreground">{message}</div>
    </Card>
  );
}
