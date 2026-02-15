export type UserLanguage = "ru" | "de" | "en";
export type UserDateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export type UserProfile = {
  uid: string;

  displayName: string | null;
  email: string | null;
  photoURL: string | null;

  language: UserLanguage;
  timezone: string;
  dateFormat: UserDateFormat;

  createdAt: number;
  updatedAt: number;
};

export type UpdateUserProfileInput = {
  displayName?: string | null;
  photoFile?: File | null;

  language?: UserLanguage;
  timezone?: string;
  dateFormat?: UserDateFormat;
};
