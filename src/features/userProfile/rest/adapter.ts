import type {
  UserProfile,
  UserProfileDto,
  UserProfileResumeUpdateInput,
} from "./types";

export function mapUserProfileDto(dto: UserProfileDto): UserProfile {
  return {
    id: dto.id,
    firebaseUid: dto.firebase_uid,
    email: dto.email,
    displayName: dto.display_name,
    photoUrl: dto.photo_url,
    language: dto.language,
    timezone: dto.timezone,
    dateFormat: dto.date_format,
    analysisPlan: dto.analysis_plan,
    resumeText: dto.resume_text,
    matchesSeenAt: dto.matches_seen_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapResumeUpdateInputToDto(
  input: UserProfileResumeUpdateInput,
): Record<string, unknown> {
  return {
    resume_text: input.resumeText,
  };
}
