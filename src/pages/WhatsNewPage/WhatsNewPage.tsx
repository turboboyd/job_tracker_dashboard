import { Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReleaseTag = "feature" | "improvement" | "fix" | "backend";

interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  items: Array<{ tag: ReleaseTag; text: string }>;
}

// ─── Changelog data ───────────────────────────────────────────────────────────

const RELEASES: ReleaseEntry[] = [
  {
    version: "0.7",
    date: "Май 2025",
    title: "Inbox, Interview Prep & Real Analytics",
    items: [
      { tag: "feature",     text: "Inbox — центр задач: просроченные, сегодня, на неделю, стагнирующие заявки" },
      { tag: "feature",     text: "Подготовка к интервью: 28 вопросов по 5 категориям с отслеживанием готовности" },
      { tag: "improvement", text: "Dashboard — виджеты Goals, Trends, Insights подключены к реальным данным Firebase" },
      { tag: "improvement", text: "Dashboard Analytics: воронка конверсии, loss-breakdown, топ Loops — всё из реальных заявок" },
      { tag: "improvement", text: "Совпадения: постраничная загрузка — 20 вакансий за раз, кнопка «Загрузить ещё»" },
    ],
  },
  {
    version: "0.6",
    date: "Апрель 2025",
    title: "Calendar, Optimization & Redesign",
    items: [
      { tag: "feature",     text: "CalendarPage: недельный и дневной вид с drag-ready слотами" },
      { tag: "feature",     text: "OptimizationPage: автоматические инсайты с приоритетами по данным воронки" },
      { tag: "improvement", text: "Глобальный редизайн интерфейса: новая цветовая система, улучшенная типографика" },
      { tag: "improvement", text: "Совпадения переключены на источник discovery preview из бэкенда" },
    ],
  },
  {
    version: "0.5",
    date: "Март 2025",
    title: "Discovery Backend & Preview Cache",
    items: [
      { tag: "backend",     text: "Кеш превью discovery: повторные запросы возвращают результат мгновенно" },
      { tag: "backend",     text: "9 источников вакансий: arbeitsagentur, adzuna, remotive, himalayas, remoteok и другие" },
      { tag: "feature",     text: "Панель превью совпадений с фильтрами по источнику и ключевым словам" },
      { tag: "improvement", text: "Реальная аутентификация Firebase вместо заглушки" },
    ],
  },
  {
    version: "0.4",
    date: "Февраль 2025",
    title: "Applications & Board",
    items: [
      { tag: "feature",     text: "Kanban-доска для заявок с drag-and-drop по колонкам воронки" },
      { tag: "feature",     text: "Страница деталей заявки: история статусов, напоминания, заметки" },
      { tag: "feature",     text: "Contacts: CRM для контактов с тегами и поиском" },
      { tag: "improvement", text: "Pipeline statuses: настройка пользовательских статусов в настройках" },
    ],
  },
  {
    version: "0.3",
    date: "Январь 2025",
    title: "Loops & CV Builder",
    items: [
      { tag: "feature",     text: "Loops (Направления): сохранение поисковых профилей с набором фильтров" },
      { tag: "feature",     text: "CV Builder: редактор резюме с разделами и версионированием" },
      { tag: "feature",     text: "CV Checker: базовая проверка резюме на ключевые слова" },
      { tag: "backend",     text: "API foundation: документы, циклы, модуль аналитики" },
    ],
  },
];

// ─── Tag chip ─────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<ReleaseTag, string> = {
  feature:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  improvement: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  fix:         "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  backend:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const TAG_LABELS: Record<ReleaseTag, string> = {
  feature:     "Фича",
  improvement: "Улучшение",
  fix:         "Фикс",
  backend:     "Бэкенд",
};

function TagChip({ tag }: { tag: ReleaseTag }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${TAG_STYLES[tag]}`}>
      {TAG_LABELS[tag]}
    </span>
  );
}

// ─── Release card ─────────────────────────────────────────────────────────────

function ReleaseCard({ release, isLatest }: { release: ReleaseEntry; isLatest: boolean }) {
  return (
    <div className="relative flex gap-5">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
          isLatest
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground"
        }`}>
          {isLatest
            ? <Sparkles className="h-3.5 w-3.5" />
            : <span className="text-[10px] font-semibold">{release.version}</span>
          }
        </div>
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>

      {/* Card */}
      <div className="mb-6 min-w-0 flex-1 rounded-[14px] border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              v{release.version}
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">{release.title}</h2>
          </div>
          <span className="text-[12px] text-muted-foreground">{release.date}</span>
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {release.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <TagChip tag={item.tag} />
              <span className="text-[13px] text-foreground/80 leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── WhatsNewPage ─────────────────────────────────────────────────────────────

export default function WhatsNewPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-7 pt-5 pb-4">
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground/60 mb-1">
          <span>Loopboard</span>
          <span>/</span>
          <span className="text-muted-foreground">Что нового</span>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
          Что нового
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          История обновлений продукта
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-2xl px-7 pt-8 pb-16">
          {RELEASES.map((release, i) => (
            <ReleaseCard key={release.version} release={release} isLatest={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
