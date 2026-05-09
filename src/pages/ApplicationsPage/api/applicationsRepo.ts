/**
 * Compatibility facade kept during staged refactor.
 *
 * Do not add new page-to-page consumers here.
 * Shared consumers should import from "src/features/applications".
 */
export {
  createApplicationsRepo,
  type ApplicationsRepo,
  type ApplicationDoc,
  type ProcessStatus,
} from "src/features/applications";
