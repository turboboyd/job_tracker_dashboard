import type { AddMatchFormValues } from "./addMatchModal.types";

export function buildCreateMatchRequest(loopId: string, values: AddMatchFormValues) {
  return {
    loopId,
    title: values.title,
    company: values.company,
    location: values.location,
    platform: values.platform,
    url: values.url,
    description: values.description,
    status: values.status,
    matchedAt: values.matchedAt,
  };
}

