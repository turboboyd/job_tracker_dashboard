import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { useGetLoopQuery } from "src/entities/loop/api/loopApi";
import { joinTitles } from "src/entities/loop/lib";
import type { Loop } from "src/entities/loop/model";
import { LoopSearchLinks } from "src/entities/loop/ui/LoopSearchLinks/LoopSearchLinks";
import {
  setLastLoopsUrl,
  setLoopDetailsPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage } from "src/shared/lib";
import { updateURLParams } from "src/shared/lib/url/updateURLParams";
import { Button } from "src/shared/ui";

import { Header, CardText } from "./Header";

export function LoopDetailsView({
  userId,
  loopId,
  onBack,
}: {
  userId: string;
  loopId: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const savedDetailsPage = useAppSelector(
    (s) => s.loopsUi.detailsPageByLoopId[loopId],
  );

  const readPageFromSearch = (search: string): number | null => {
    try {
      const sp = new URLSearchParams(search);
      const raw = sp.get("page");
      const n = raw ? Number(raw) : NaN;
      const i = Number.isFinite(n) ? Math.trunc(n) : NaN;
      return i > 0 ? i : null;
    } catch {
      return null;
    }
  };

  const urlPage = readPageFromSearch(location.search);
  const detailsPage = urlPage ?? savedDetailsPage ?? 1;

  // если page отсутствует в URL — проставим (replace), чтобы ссылка была шарится
  useEffect(() => {
    if (urlPage !== null) return;

    updateURLParams(
      navigate,
      location,
      { page: String(detailsPage) },
      { replace: true },
    );
  }, [urlPage, detailsPage, navigate, location]);

  // держим Redux в синхроне с фактической страницей
  useEffect(() => {
    dispatch(setLoopDetailsPage({ loopId, page: detailsPage }));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, loopId, detailsPage, location.pathname, location.search]);

  const loopQ = useGetLoopQuery({ loopId });
  const loop: Loop | null = loopQ.data ?? null;

  const title = useMemo(
    () => loop?.name ?? t("loops.detailsTitle", "Loop"),
    [loop?.name, t],
  );

  const subtitle = useMemo(() => {
    if (!loop) {
      return t(
        "loops.detailsHint",
        "Change filters → Apply → links update and filters persist.",
      );
    }

    const roles = joinTitles(loop.titles) || t("loops.dash", "—");
    const remoteText =
      loop.remoteMode === "remote_only"
        ? t("loops.remoteOnly", "Remote")
        : t("loops.any", "Any");

    return `${roles} · ${loop.location} · ${remoteText}`;
  }, [loop, t]);

  const content = useMemo(() => {
    if (loopQ.isLoading) {
      return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
    }

    if (loopQ.isError) {
      return <CardText>{getErrorMessage(loopQ.error)}</CardText>;
    }

    if (!loop) {
      return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;
    }

    return (
      <LoopSearchLinks
        userId={userId}
        page={detailsPage}
        onPageChange={(p) => {
          dispatch(setLoopDetailsPage({ loopId, page: p }));
          updateURLParams(
            navigate,
            location,
            { page: String(p) },
            { replace: true },
          );
        }}
        loop={{
          id: loop.id,
          name: loop.name,
          titles: loop.titles,
          location: loop.location,
          radiusKm: loop.radiusKm,
          platforms: loop.platforms,
          remoteMode: loop.remoteMode,
          filters: loop.filters,
        }}
      />
    );
  }, [
    loopQ.isLoading,
    loopQ.isError,
    loopQ.error,
    loop,
    t,
    userId,
    detailsPage,
    dispatch,
    loopId,
    navigate,
    location,
  ]);

  return (
    <div className="space-y-6">
      <Header
        title={title}
        subtitle={subtitle}
        right={
          <Button variant="outline" shape="lg" onClick={onBack}>
            {t("loops.back", "Back")}
          </Button>
        }
      />

      {content}
    </div>
  );
}
