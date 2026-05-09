import type { DateFormat, UiLanguage, UserSettings } from "src/entities/userSettings";
import { getDefaultTimeZone, getTimeZoneOptions } from "src/shared/lib";

export interface ProfileSettingsInitial {
  firstName: string;
  lastName: string;
  timeZone: string;
  dateFormat: DateFormat;
  uiLanguage: UiLanguage | undefined;
}

export function splitDisplayName(
  name: string | null | undefined,
): { firstName: string; lastName: string } {
  const clean = (name ?? "").trim().replace(/\s+/g, " ");

  if (!clean) {
    return { firstName: "", lastName: "" };
  }

  const [firstName = "", ...rest] = clean.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

export function joinDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function buildProfileSettingsInitial(
  settings: UserSettings,
  displayName: string | null | undefined,
): ProfileSettingsInitial {
  const display = splitDisplayName(displayName);

  return {
    firstName: display.firstName,
    lastName: display.lastName,
    timeZone: settings.timeZone || getDefaultTimeZone(),
    dateFormat: settings.dateFormat,
    uiLanguage: settings.uiLanguage,
  };
}

export function buildTimeZoneOptions() {
  return getTimeZoneOptions().map((timeZone) => ({
    value: timeZone,
    label: timeZone,
  }));
}

export function hasPreferencesChanges(
  initial: ProfileSettingsInitial,
  current: Pick<ProfileSettingsInitial, "timeZone" | "dateFormat">,
) {
  return (
    current.timeZone !== initial.timeZone ||
    current.dateFormat !== initial.dateFormat
  );
}

export function buildProfileFormKey({
  uid,
  displayName,
  initial,
}: {
  uid: string;
  displayName: string | null | undefined;
  initial: ProfileSettingsInitial;
}) {
  const language = initial.uiLanguage ?? "";
  const safeUid = uid || "anon";
  const safeDisplayName = displayName ?? "";

  return [
    safeUid,
    safeDisplayName,
    initial.timeZone,
    initial.dateFormat,
    language,
  ].join("|");
}
