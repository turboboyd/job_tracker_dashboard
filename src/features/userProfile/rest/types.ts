export type UserProfilePlan = "free" | "basic" | "premium";

export interface UserProfileDto {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  language: string;
  timezone: string;
  date_format: string;
  analysis_plan: UserProfilePlan;
  resume_text: string | null;
  matches_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  language: string;
  timezone: string;
  dateFormat: string;
  analysisPlan: UserProfilePlan;
  resumeText: string | null;
  /** Watermark for the Matches "Новые" tab; null until first marked seen. */
  matchesSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResumeUpdateInput {
  /** New resume text. Send "" to clear the saved resume. */
  resumeText: string;
}
