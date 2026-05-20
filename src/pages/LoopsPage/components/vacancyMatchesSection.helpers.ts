import type { VacancyMatch, VacancyMatchStatus } from "src/features/vacancyMatches";

const ACTIONABLE_VACANCY_MATCH_STATUSES: ReadonlySet<VacancyMatchStatus> = new Set([
  "new",
  "saved",
]);

export const EMPTY_MATCHES_COPY = {
  title: "Автоматический поиск ещё не подключён.",
  findManually: "Пока откройте источник, найдите вакансию и добавьте её по ссылке.",
  afterAdd: "После добавления вакансия появится здесь.",
} as const;

export const VACANCY_MATCH_CONVERSION_COPY = {
  createAction: "Создать заявку",
  creating: "Создаём...",
  created: "Заявка создана",
  alreadyCreated: "Заявка уже создана",
  openApplication: "Открыть заявку",
  explicitOnly: "Создание заявки выполняется только по вашему нажатию.",
  matchRetained: "Сохранённое совпадение останется в направлении поиска.",
} as const;

export interface VacancyMatchConversionFeedback {
  message: string;
  applicationId: string;
}

export function isActionableVacancyMatch(
  match: Pick<VacancyMatch, "status">,
): boolean {
  return ACTIONABLE_VACANCY_MATCH_STATUSES.has(match.status);
}

export function getCreateApplicationButtonLabel(isConverting: boolean): string {
  return isConverting
    ? VACANCY_MATCH_CONVERSION_COPY.creating
    : VACANCY_MATCH_CONVERSION_COPY.createAction;
}

export function getApplicationDetailsRoute(applicationId: string): string {
  return `/dashboard/applications/${encodeURIComponent(applicationId)}`;
}

export function getPersistedConversionFeedback(
  match: Pick<VacancyMatch, "applicationId">,
): VacancyMatchConversionFeedback | null {
  if (!match.applicationId) return null;
  return {
    message: VACANCY_MATCH_CONVERSION_COPY.alreadyCreated,
    applicationId: match.applicationId,
  };
}

export function getEmptyMatchesText(): string {
  return [
    EMPTY_MATCHES_COPY.title,
    EMPTY_MATCHES_COPY.findManually,
    EMPTY_MATCHES_COPY.afterAdd,
  ].join(" ");
}

export function getConversionCopyText(): string {
  return Object.values(VACANCY_MATCH_CONVERSION_COPY).join(" ");
}
