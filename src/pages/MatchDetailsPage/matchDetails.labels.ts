import type { TFunction } from "i18next";

import type { MatchDetailsLabels } from "./matchDetails.model";

export function buildMatchDetailsLabels(t: TFunction): MatchDetailsLabels {
  return {
    actionsTitle: t("matches.details.actionsTitle"),
    backLabel: t("matches.details.backToFiltered"),
    deleteLabel: t("matches.common.delete"),
    descriptionTitle: t("matches.details.descriptionTitle"),
    editLabel: t("matches.common.edit"),
    loading: t("matches.common.loading"),
    locationLabel: t("matches.details.fields.location"),
    loopLabel: t("matches.details.fields.loop"),
    matchedAtLabel: t("matches.details.fields.matchedAt"),
    metaTitle: t("matches.details.metaTitle"),
    noDescription: t("matches.details.noDescription"),
    notFound: t("matches.details.notFound"),
    openLinkLabel: t("matches.details.openLink"),
    platformLabel: t("matches.details.fields.platform"),
    statusLabel: t("matches.common.status"),
    subtitle: t("matches.details.subtitle"),
    title: t("matches.details.title"),
  };
}
