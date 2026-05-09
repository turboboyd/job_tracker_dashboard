// Types (re-exported from entity for convenience)
export type { ContactDoc, InteractionDoc, PhoneEntry, EmailEntry } from "src/entities/contact";
export type {
  ContactRole,
  InteractionDirection,
  InteractionSentiment,
  InteractionType,
  PhoneLabel,
  EmailLabel,
} from "src/entities/contact";

// Input / mutation types
export type {
  CreateContactInput,
  CreateInteractionInput,
  UpdateContactInput,
  UpdateInteractionInput,
} from "./firestore/mappers";

// Query result types
export type { ContactRow, InteractionRow } from "./firestore/queries";

// Queries
export {
  getContact,
  getContacts,
  getContactsByApplication,
  getInteraction,
  getInteractionsByApplication,
  getInteractionsByContact,
  getPendingNextStepInteractions,
} from "./firestore/queries";

// Mutations — contacts
export {
  archiveContact,
  createContact,
  deleteContact,
  linkContactToApplication,
  unlinkContactFromApplication,
  updateContact,
} from "./firestore/mutations";

// Mutations — interactions
export {
  clearInteractionNextStep,
  createInteraction,
  deleteInteraction,
  updateInteraction,
} from "./firestore/mutations";

// UI components
export { ApplicationContactsCard } from "./ui/ApplicationContactsCard/ApplicationContactsCard";
export { ContactCard } from "./ui/ContactCard/ContactCard";
export { ContactFormModal } from "./ui/ContactFormModal/ContactFormModal";
export { InteractionTimeline } from "./ui/InteractionTimeline/InteractionTimeline";
export { QuickLogModal } from "./ui/QuickLogModal/QuickLogModal";
