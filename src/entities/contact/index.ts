// Types
export type { ContactDoc, PhoneEntry, EmailEntry } from "./model/contact.types";
export type { InteractionDoc } from "./model/interaction.types";
export type {
  ContactRole,
  EmailLabel,
  InteractionDirection,
  InteractionSentiment,
  InteractionType,
  PhoneLabel,
} from "./model/primitive.types";

// Constants
export {
  CONTACT_ROLE_KEYS,
  CONTACT_ROLE_LABELS,
  INTERACTION_TYPE_ICON,
  INTERACTION_TYPE_KEYS,
  INTERACTION_TYPE_LABELS,
} from "./model/contact.constants";

// Helpers
export {
  buildMailtoHref,
  buildTelHref,
  getContactFullName,
  getContactInitials,
  getPrimaryEmail,
  getPrimaryPhone,
} from "./model/contact.helpers";

// UI
export { ContactAvatar } from "./ui/ContactAvatar/ContactAvatar";
export { ContactRoleBadge } from "./ui/ContactRoleBadge/ContactRoleBadge";
export { InteractionTypeIcon } from "./ui/InteractionTypeIcon/InteractionTypeIcon";
