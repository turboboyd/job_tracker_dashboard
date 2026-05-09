declare const __ENV__: {
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CONNECT_URL?: string;
};

interface BuildGoogleCalendarConnectUrlParams {
  endpoint: string;
  language: string;
  returnTo: string;
  userId: string;
}

export function getGoogleCalendarConnectEndpoint(): string {
  return __ENV__.GOOGLE_CALENDAR_CONNECT_URL?.trim() ?? "";
}

export function getGoogleCalendarClientId(): string {
  return __ENV__.GOOGLE_CALENDAR_CLIENT_ID?.trim() ?? "";
}

export function buildGoogleCalendarConnectUrl({
  endpoint,
  language,
  returnTo,
  userId,
}: BuildGoogleCalendarConnectUrlParams): string {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("lng", language);
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("uid", userId);

  return url.toString();
}
