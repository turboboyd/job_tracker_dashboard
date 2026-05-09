import { Plus, Search, X } from "lucide-react";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";

interface ContactsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddContact: () => void;
  totalCount: number;
  filteredCount: number;
  allTags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

function TagPill({
  tag,
  isActive,
  onSelect,
}: {
  tag: string;
  isActive: boolean;
  onSelect: (t: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(isActive ? null : tag)}
      className={classNames(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium",
        "transition-colors whitespace-nowrap",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {tag}
      {isActive ? <X className="h-3 w-3 ml-0.5" aria-hidden="true" /> : null}
    </button>
  );
}

export function ContactsToolbar({
  searchQuery,
  onSearchChange,
  onAddContact,
  totalCount,
  filteredCount,
  allTags,
  activeTag,
  onTagChange,
}: ContactsToolbarProps) {
  const isFiltered = searchQuery.trim() || activeTag;
  const countLabel = isFiltered
    ? `${filteredCount} of ${totalCount}`
    : `${totalCount}`;

  return (
    <div className="space-y-3">
      {/* Row 1: search + count + add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            preset="default"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, company, email, tag…"
            className="pl-9"
          />
        </div>

        <span className="text-sm text-muted-foreground tabular-nums">
          {countLabel} contact{filteredCount !== 1 ? "s" : ""}
        </span>

        <div className="ml-auto">
          <Button shape="pill" className="gap-2" onClick={onAddContact}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New contact
          </Button>
        </div>
      </div>

      {/* Row 2: tag pills — only when tags exist */}
      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              isActive={activeTag === tag}
              onSelect={onTagChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
