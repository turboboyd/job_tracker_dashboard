import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createApplicationFromVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  patchLoopVacancyMatchViaRest,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import { getErrorMessage } from "src/shared/lib";
import { Button } from "src/shared/ui";

import {
  EMPTY_MATCHES_COPY,
  getApplicationDetailsRoute,
  getCreateApplicationButtonLabel,
  getPersistedConversionFeedback,
  isActionableVacancyMatch,
  VACANCY_MATCH_CONVERSION_COPY,
  type VacancyMatchConversionFeedback,
} from "./vacancyMatchesSection.helpers";

type Props = {
  loopId: string;
  reloadKey?: number;
  onAddVacancy?: () => void;
  onOpenSources?: () => void;
};

function getStatusLabel(match: VacancyMatch): string {
  if (match.status === "converted" && match.applicationId) return "Уже создана заявка";
  if (match.status === "ignored") return "Игнорирована";
  if (match.status === "saved") return "Сохранена";
  return "Новая";
}

export function VacancyMatchesSection({ loopId, reloadKey = 0, onAddVacancy, onOpenSources }: Props) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [conversionFeedback, setConversionFeedback] = useState<Record<string, VacancyMatchConversionFeedback>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const envelope = await listLoopVacancyMatchesViaRest(loopId, { limit: 50, offset: 0 });
        if (!cancelled) setMatches(envelope.items);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setMatches([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load().catch((loadError: unknown) => {
      if (!cancelled) setError(getErrorMessage(loadError));
    });

    return () => {
      cancelled = true;
    };
  }, [loopId, reloadKey]);

  async function handleConvert(match: VacancyMatch) {
    setConvertingId(match.id);
    setError(null);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(loopId, match.id);
      setMatches((current) =>
        current.map((item) => (item.id === match.id ? result.match : item)),
      );
      setConversionFeedback((current) => ({
        ...current,
        [match.id]: {
          applicationId: result.applicationId,
          message: result.alreadyLinked
            ? VACANCY_MATCH_CONVERSION_COPY.alreadyCreated
            : VACANCY_MATCH_CONVERSION_COPY.created,
        },
      }));
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConvertingId(null);
    }
  }

  async function handleIgnore(match: VacancyMatch) {
    setIgnoringId(match.id);
    setError(null);
    try {
      const updated = await patchLoopVacancyMatchViaRest(loopId, match.id, { status: "ignored" });
      setMatches((current) => current.map((item) => (item.id === match.id ? updated : item)));
    } catch (ignoreError: unknown) {
      setError(getErrorMessage(ignoreError));
    } finally {
      setIgnoringId(null);
    }
  }

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [matches],
  );

  return (
    <section className="mt-6 rounded-[16px] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Найденные вакансии</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Здесь будут сохранённые вакансии и кандидаты по этому направлению поиска.
          </p>
        </div>
        {onAddVacancy ? (
          <Button onClick={onAddVacancy}>Добавить вакансию</Button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-muted/30 p-3 text-[13px] text-muted-foreground">
          Не удалось загрузить найденные вакансии. Проверьте подключение к backend и попробуйте
          ещё раз.
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Загружаем найденные вакансии...</p>
        ) : null}
        {!isLoading && sortedMatches.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border bg-background p-4 text-[13px] text-muted-foreground">
            <p className="font-medium text-foreground">{EMPTY_MATCHES_COPY.title}</p>
            <p className="mt-1">{EMPTY_MATCHES_COPY.findManually}</p>
            <p className="mt-1">{EMPTY_MATCHES_COPY.afterAdd}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {onAddVacancy ? <Button onClick={onAddVacancy}>Добавить вакансию</Button> : null}
              {onOpenSources ? (
                <button
                  type="button"
                  onClick={onOpenSources}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Открыть источники
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {sortedMatches.map((match) => {
          const actionable = isActionableVacancyMatch(match);
          const applicationFeedback =
            conversionFeedback[match.id] ?? getPersistedConversionFeedback(match);
          return (
            <div key={match.id} className="rounded-[12px] border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-foreground">
                    {match.roleTitle || "Вакансия без названия"}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                    {match.companyName || "Компания не указана"}
                    {match.locationText ? ` · ${match.locationText}` : ""}
                  </div>
                  <a
                    href={match.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-[12px] text-primary hover:underline"
                  >
                    {match.sourceUrl}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {getStatusLabel(match)}
                  </span>
                  {actionable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleIgnore(match)}
                        disabled={ignoringId === match.id}
                        className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        {ignoringId === match.id ? "..." : "Игнорировать"}
                      </button>
                      <Button
                        onClick={() => handleConvert(match)}
                        disabled={convertingId === match.id}
                      >
                        {getCreateApplicationButtonLabel(convertingId === match.id)}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">
                {VACANCY_MATCH_CONVERSION_COPY.explicitOnly}
              </p>
              <VacancyAnalysisPanel loopId={loopId} matchId={match.id} />
              {applicationFeedback ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
                  <span>{applicationFeedback.message}</span>
                  <button
                    type="button"
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() =>
                      navigate(
                        getApplicationDetailsRoute(applicationFeedback.applicationId),
                      )
                    }
                  >
                    {VACANCY_MATCH_CONVERSION_COPY.openApplication}
                  </button>
                  <span>{VACANCY_MATCH_CONVERSION_COPY.matchRetained}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
