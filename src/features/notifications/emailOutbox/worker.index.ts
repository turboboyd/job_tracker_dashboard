export { createResendEmailProvider } from "./emailProvider.resend";
export {
  createAdminAuthRecipientResolver,
  createEmailOutboxRuntime,
  createFirestoreEmailOutboxRepository,
  type AdminAuthLike,
  type AdminAuthUserLike,
  type AdminFirestoreLike,
  type EmailOutboxRuntime,
} from "./emailOutbox.runtime";
export {
  processEmailOutboxBatch,
  shouldProcessEmailOutboxItem,
  type EmailOutboxBatchSummary,
  type EmailOutboxRepository,
  type EmailRecipientResolver,
  type ProcessEmailOutboxBatchOptions,
} from "./emailOutbox.processor";
export {
  buildEmailContent,
  processEmailOutboxItem,
  type EmailProvider,
  type EmailRecipient,
  type EmailSendRequest,
  type EmailSendResult,
  type ProcessEmailOutboxItemOptions,
} from "./emailOutbox.worker";
