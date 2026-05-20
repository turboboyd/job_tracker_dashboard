# Matches Feed Workflow

`/dashboard/matches` is the incoming vacancy review surface. It is the place
where the user should see potentially relevant vacancies before deciding what
belongs in Applications.

## Product Model

| State | Meaning | Persisted | Creates Application |
| --- | --- | --- | --- |
| Discovery Preview Item | Temporary result from a bounded source preview. | No | No |
| Vacancy Match | Saved candidate vacancy inside a Loop. | Yes | No |
| Application | User-owned tracked application record. | Yes | Yes, only after explicit action |

The user flow is intentionally manual at the decision points:

1. Run a safe source preview.
2. Review returned items.
3. Save selected items as Vacancy Matches.
4. Analyze a saved match if useful.
5. Create an Application from a saved match only when the user chooses it.

## Current Source Scope

The current safe adapter set is intentionally split by source:

- `arbeitsagentur`: public Jobsuche JSON endpoint.
- `arbeitnow`: public Europe/remote jobs API, no credentials.
- `adzuna`: official Adzuna Germany API, requires server-side
  `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.
- `remotive`: public Remotive remote jobs API.
- `remotejobs`: public RemoteJobs.org API, no credentials.
- `himalayas`: public Himalayas Remote Jobs API, no credentials.
- `remoteok`: public Remote OK JSON feed, no credentials, direct source link
  and attribution retained.
- `greenhouse`: public Greenhouse Job Board API for configured company board
  tokens from `GREENHOUSE_BOARD_TOKENS`.
- `lever`: public Lever Postings API for configured company site names from
  `LEVER_SITE_NAMES`.

All adapters are bounded and dry-run oriented. StepStone, Indeed, LinkedIn,
XING, manual URL, and broad company website sources are not enabled for source
execution. They remain registry-only unless a future implementation explicitly
adds a safe adapter.

Server-side setup for Adzuna, Greenhouse, and Lever is documented in
[Source Adapter Setup](source-adapter-setup.md).

## `/dashboard/matches` Contract

The page should become the central feed for:

- saved Vacancy Matches across Loops
- safe source preview results when the page opens or the user requests a
  refresh from `/dashboard/matches`
- future safe source candidates, one adapter at a time

The page must make these boundaries clear:

- preview results are not saved automatically
- saved matches are not Applications
- Applications are created only after an explicit user action
- no external employer submission happens from this workflow
- no scheduled background refresh is enabled yet

Current UI behavior:

- `/dashboard/matches` automatically runs a bounded preview when the page opens
  for the selected Loop filter, or for all eligible Loops when no Loop is
  selected.
- The page reads `GET /api/v1/discovery-sources/runtime-status` to show whether
  safe sources are ready on the current server. The response contains only
  booleans/status codes and never exposes keys or token lists.
- The preview calls `POST /api/v1/discovery-runs` with `dry_run = true`,
  `search_scope = broad`, and the runnable source ids selected in each Loop.
  The broader mode keeps requests bounded, but avoids over-narrowing public job
  APIs with every keyword from the Loop.
- Public API adapters may try a small bounded set of fallback search phrases
  for the same source when the first phrase is too narrow. This is still a
  preview request, not broad crawling: each source keeps the same timeout,
  page, and five-item page size.
- The first load requests `page = 1` and `page_size = 5`. When the user reaches
  the bottom of a source block, the UI requests the next page for that source
  only and appends another bounded group of up to five preview items.
- Source summary cards show whether a source returned no current results,
  returned a count, how many preview items are new vs already saved, and whether
  more preview items may be available.
- Already saved preview items are hidden by default so the review feed
  prioritizes new candidates. The user can disable the filter with
  `Показать сохранённые` / `Скрыть сохранённые` when they need to inspect saved
  preview items again.
- Preview cards can also be hidden with `Не интересно`. The backend stores this
  as a preview ignore, not as a Vacancy Match. It does not create an
  Application and does not submit anything externally.
- Hidden preview cards can be temporarily shown with `Показать скрытые`. A
  shown ignored card can be restored with `Вернуть в preview`, which deletes
  the preview ignore record.
- The "Обновить вакансии" action remains a manual refresh for the same safe
  dry-run preview.
- Preview cards can be opened on the source site.
- A preview card can be saved as a Vacancy Match only after the user clicks
  "Сохранить как совпадение".
- Saving a preview card refreshes the saved matches list. It does not create an
  Application.
- Saved Vacancy Matches are shown on `/dashboard/matches` with the existing
  resume analysis panel.
- A saved Vacancy Match can become an Application only after the user clicks
  "Создать заявку".
- If a saved match is already linked to an Application, the page shows
  "Открыть заявку" instead of creating a duplicate.

## Backend Endpoints Involved

Preview source candidates:

```http
POST /api/v1/discovery-runs
```

Save one selected preview item:

```http
POST /api/v1/loops/{loop_id}/matches/from-preview
```

Hide one preview item from future preview feeds:

```http
POST /api/v1/loops/{loop_id}/matches/preview-ignores
GET /api/v1/loops/{loop_id}/matches/preview-ignores
DELETE /api/v1/loops/{loop_id}/matches/preview-ignores/{ignore_id}
```

Analyze one saved match:

```http
POST /api/v1/loops/{loop_id}/matches/{match_id}/analyses
```

Create one Application from one saved match:

```http
POST /api/v1/loops/{loop_id}/matches/{match_id}/create-application
```

## Future Work

Future stages can add:

- bulk review tools for hidden preview items
- better cross-source deduplication before display
- scheduled refresh with explicit limits, logs, and source controls
- additional source adapters after separate safety review

These future stages must preserve the core boundary: Applications are never
created without an explicit user action.
