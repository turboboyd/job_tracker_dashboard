import type { ApplicationDoc } from "./documents.types";

export type DotPatch = Record<string, unknown>;

export type ApplicationPatchInput = Partial<ApplicationDoc> | DotPatch;
