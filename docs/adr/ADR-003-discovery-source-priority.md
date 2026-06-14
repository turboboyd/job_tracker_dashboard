# ADR-003 — Discovery source priority

- **Status:** Accepted (Stage 6a)
- **Date:** 2026-06-13
- **Related:** [Loops / Matches architecture](../LOOPS_MATCHES_ARCHITECTURE.md),
  [Source adapter setup](../source-adapter-setup.md)

## Context

Discovery sources (job boards) were previously listed LinkedIn-first and
LinkedIn was a default-promoted/pre-selected source. LinkedIn is the most
legally/API-restricted source to integrate against, so promoting it first is
the wrong default. Separately, source order/labels were duplicated across
several page-specific helpers, so the order drifted between the Create Loop
modal, Loop Details and the Matches page.

## Decision

**Prioritize legal / easier-to-integrate job boards first. LinkedIn stays
supported but is never first and never default-promoted.**

Canonical visible order:

1. Jobbörse Arbeitsagentur
2. Indeed (DE)
3. StepStone
4. XING Jobs
5. Jobvector
6. Joblift
7. Kimeta
8. **LinkedIn** — only if already supported, but **not** first and **not**
   default-selected for new loops

Rules:

- **LinkedIn is legally / API-riskier** and must not be the primary or default
  source. It is not removed from the codebase (it stays available for users who
  opt in), it is simply not promoted.
- **Default selected sources** for a new loop prefer the legal/easier boards
  above and exclude LinkedIn.
- **Source order and labels are centralized** in the `entities/loop` layer
  (`src/entities/loop/model/platformRegistry.ts` — `DISCOVERY_SOURCE_PRIORITY`,
  `DEFAULT_SELECTED_PLATFORMS`, `getDiscoverySourcePriority`). All UI surfaces
  derive their order from this single source of truth:
  - the Create Loop modal source chips,
  - the Loop Details Sources tab and the Overview source rail,
  - the Matches page sources strip,
  - the loop settings panel.

## Consequences

- One place to change source priority; the order can no longer drift between
  pages.
- **Do not** re-introduce a hard-coded source order in a page-specific helper.
  If a new surface needs source order, it must consume the centralized registry.
- Adding a new source means registering it in `platformRegistry.ts` (and its
  backend adapter per [source-adapter-setup.md](../source-adapter-setup.md)),
  not editing per-page lists.
