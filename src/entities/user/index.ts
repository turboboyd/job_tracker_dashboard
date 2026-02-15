export type {
  UserLanguage,
  UserDateFormat,
  UserProfile,
  UpdateUserProfileInput,
} from "./model";

export { makeDefaultProfile, normalizeProfile } from "./lib";

export {
  deleteUserProfile,
  getOrCreateProfile,
  updateUserProfile,
  uploadAvatar,
  userProfilesCollection,
  userProfileDocRef,
} from "./service";
