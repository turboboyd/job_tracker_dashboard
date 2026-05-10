import { Pagination } from "src/shared/ui/Pagination";

import type { SearchLink } from "../../lib/links/searchLinks";
import type { LoopPlatform } from "../../model";

import { PlatformLinkCard } from "./components/PlatformLinkCard";
import type { ActiveLink } from "./types";

interface ResultsSectionProps {
  links: SearchLink[];
  activeLink: ActiveLink;
  onOpenLink: (platform: LoopPlatform, url: string) => void;
  onAddLink: (platform?: LoopPlatform) => void;
  addDisabled: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}

export function LoopSearchResultsSection({
  links,
  activeLink,
  onOpenLink,
  onAddLink,
  addDisabled,
  page,
  totalPages,
  onPageChange,
  disabled,
}: ResultsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {links.map((link) => {
          const isActive =
            activeLink?.platform === link.platform && activeLink?.url === link.url;

          return (
            <PlatformLinkCard
              key={`${link.platform}:${link.url}`}
              platform={link.platform}
              url={link.url}
              isActive={isActive}
              onOpen={() => onOpenLink(link.platform, link.url)}
              onAdd={() => onAddLink(link.platform)}
              addDisabled={addDisabled}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-center">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={disabled}
        />
      </div>
    </>
  );
}
