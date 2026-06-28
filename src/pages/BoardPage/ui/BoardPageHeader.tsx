import { Filter, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = Readonly<{
  /** Optional handlers — kept optional so the header stays presentational and
   *  preserves today's inert placeholder buttons until they are wired up. */
  onFilter?: () => void;
  onSearch?: () => void;
  onNewApplication?: () => void;
}>;

/**
 * Presentational board page header: breadcrumb, title, subtitle and the
 * filter / search / new-application action controls. Follows the
 * `Loopboard Redesign.html` board header layout.
 */
export function BoardPageHeader({ onFilter, onSearch, onNewApplication }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-7 pt-5 pb-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
            <span>Loopboard</span>
            <span>/</span>
            <span className="text-muted-foreground">{t("board.title", "Доска заявок")}</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {t("board.title", "Доска заявок")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("board.subtitle", "Drag applications between columns to update status.")}
          </p>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            onClick={onFilter}
            className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Filter className="h-3.5 w-3.5 text-subtle-foreground" />
            {t("board.allLoops", "Все направления")}
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-3.5 w-3.5 text-subtle-foreground" />
            {t("board.search", "Поиск")}
          </button>
          <button
            type="button"
            onClick={onNewApplication}
            className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("board.newApplication", "Новая заявка")}
          </button>
        </div>
      </div>
    </div>
  );
}
