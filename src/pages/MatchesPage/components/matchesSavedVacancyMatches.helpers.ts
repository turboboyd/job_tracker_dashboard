import type { Loop } from "src/entities/loop";
import type { VacancyMatch, VacancyMatchStatus } from "src/features/vacancyMatches";

import { getRunnableDiscoverySourceLabel } from "./matchesDiscoveryPreview.helpers";

const ACTIONABLE_MATCH_STATUSES: ReadonlySet<VacancyMatchStatus> = new Set([
  "new",
  "saved",
]);

export const MATCHES_SAVED_MATCHES_COPY = {
  title: "Сохранённые совпадения",
  intro:
    "Здесь собраны вакансии, которые вы уже сохранили из предварительного поиска или вручную.",
  loading: "Загружаем сохранённые совпадения...",
  empty: "Пока сохранённых совпадений нет.",
  error: "Не удалось загрузить сохранённые совпадения. Попробуйте ещё раз.",
  createApplication: "Создать заявку",
  creatingApplication: "Создаём...",
  applicationCreated: "Заявка создана",
  applicationAlreadyCreated: "Заявка уже создана",
  openApplication: "Открыть заявку",
  explicitOnly: "Заявка создаётся только по вашему нажатию.",
  noExternalSubmission: "Внешний отклик на сайте работодателя не отправляется.",
  matchRetained: "Сохранённое совпадение остаётся в списке.",
  ignore: "Игнорировать",
  ignoring: "...",
  statusNew: "Новая",
  statusSaved: "Сохранена",
  statusIgnored: "Игнорирована",
  statusConverted: "Заявка создана",
  companyMissing: "Компания не указана",
  titleMissing: "Вакансия без названия",
  legacyApplicationsTitle: "Уже созданные заявки",
  legacyApplicationsIntro:
    "Это записи, которые уже находятся в работе. Новые кандидаты и сохранённые совпадения показаны выше.",
} as const;

export interface MatchWithLoopName {
  loopName: string;
  match: VacancyMatch;
}

export interface MatchApplicationFeedback {
  applicationId: string;
  message: string;
}

export function isSavedMatchActionable(
  match: Pick<VacancyMatch, "status">,
): boolean {
  return ACTIONABLE_MATCH_STATUSES.has(match.status);
}

export function getSavedMatchStatusLabel(
  match: Pick<VacancyMatch, "applicationId" | "status">,
): string {
  if (match.applicationId || match.status === "converted") {
    return MATCHES_SAVED_MATCHES_COPY.statusConverted;
  }
  if (match.status === "ignored") return MATCHES_SAVED_MATCHES_COPY.statusIgnored;
  if (match.status === "saved") return MATCHES_SAVED_MATCHES_COPY.statusSaved;
  return MATCHES_SAVED_MATCHES_COPY.statusNew;
}

export function getSavedMatchSourceLabel(
  match: Pick<VacancyMatch, "source">,
): string {
  return getRunnableDiscoverySourceLabel(match.source);
}

export function getCreateApplicationLabel(isCreating: boolean): string {
  return isCreating
    ? MATCHES_SAVED_MATCHES_COPY.creatingApplication
    : MATCHES_SAVED_MATCHES_COPY.createApplication;
}

export function getApplicationDetailsRoute(applicationId: string): string {
  return `/dashboard/applications/${encodeURIComponent(applicationId)}`;
}

export function getPersistedApplicationFeedback(
  match: Pick<VacancyMatch, "applicationId">,
): MatchApplicationFeedback | null {
  if (!match.applicationId) return null;
  return {
    applicationId: match.applicationId,
    message: MATCHES_SAVED_MATCHES_COPY.applicationAlreadyCreated,
  };
}

export function sortSavedMatchesByUpdatedAt(
  items: readonly MatchWithLoopName[],
): MatchWithLoopName[] {
  return [...items].sort((a, b) => b.match.updatedAt.localeCompare(a.match.updatedAt));
}

export function getSavedMatchesTargetLoops(
  loops: readonly Loop[],
  selectedLoopIds: readonly string[],
): Loop[] {
  const selected = new Set(selectedLoopIds);
  return loops
    .filter((loop) => loop.status !== "archived")
    .filter((loop) => selected.size === 0 || selected.has(loop.id));
}

export function getSavedMatchesCopyText(): string {
  return Object.values(MATCHES_SAVED_MATCHES_COPY).join(" ");
}
