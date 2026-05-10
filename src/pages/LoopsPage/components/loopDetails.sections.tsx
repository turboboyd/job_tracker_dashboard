import type { TFunction } from "i18next";

import { LoopSearchLinks, type Loop } from "src/entities/loop";
import { getErrorMessage } from "src/shared/lib";
import { Button } from "src/shared/ui";

import { CardText, Header } from "./Header";
import {
  getLoopDetailsSubtitle,
  getLoopDetailsTitle,
  toLoopSearchLinksLoop,
} from "./loopDetails.helpers";

interface LoopDetailsHeaderProps {
  loop: Loop | null;
  onBack: () => void;
  t: TFunction;
}

export function LoopDetailsHeader({
  loop,
  onBack,
  t,
}: LoopDetailsHeaderProps) {
  return (
    <Header
      title={getLoopDetailsTitle(loop, t)}
      subtitle={getLoopDetailsSubtitle(loop, t)}
      right={
        <Button variant="outline" shape="lg" onClick={onBack}>
          {t("loops.back", "Back")}
        </Button>
      }
    />
  );
}

interface LoopDetailsContentProps {
  userId: string;
  loop: Loop | null;
  page: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onPageChange: (page: number) => void;
  t: TFunction;
}

export function LoopDetailsContent({
  userId,
  loop,
  page,
  isLoading,
  isError,
  error,
  onPageChange,
  t,
}: LoopDetailsContentProps) {
  if (isLoading) {
    return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
  }

  if (isError) {
    return <CardText>{getErrorMessage(error)}</CardText>;
  }

  if (!loop) {
    return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;
  }

  return (
    <LoopSearchLinks
      userId={userId}
      page={page}
      onPageChange={onPageChange}
      loop={toLoopSearchLinksLoop(loop)}
    />
  );
}
