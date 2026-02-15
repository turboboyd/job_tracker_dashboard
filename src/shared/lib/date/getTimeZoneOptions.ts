export function getTimeZoneOptions(): string[] {
  const anyIntl = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
  };
  const supported = anyIntl.supportedValuesOf?.("timeZone");

  if (Array.isArray(supported) && supported.length > 50) {
    return supported;
  }

  return [
    "Europe/Berlin",
    "Europe/London",
    "Europe/Paris",
    "Europe/Warsaw",
    "Europe/Kyiv",
    "Europe/Istanbul",
    "Europe/Moscow",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Tbilisi",
    "Asia/Yerevan",
    "Asia/Almaty",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
  ];
}
