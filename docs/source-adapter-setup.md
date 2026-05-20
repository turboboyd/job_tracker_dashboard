# Source Adapter Setup

This document describes the safe vacancy source adapters used by the matches
feed. It contains placeholders only. Do not commit real keys, token lists, or
private company source configuration.

## Source Matrix

| Source id | Adapter type | Server config | Ready when | Notes |
| --- | --- | --- | --- | --- |
| `arbeitsagentur` | Public job API | none | always | Uses the bounded Jobsuche API preview adapter. |
| `arbeitnow` | Public job API | none | always | Europe and remote jobs source, preview-only and no API key required. Uses a tiny page window because the API is page-based, not search-based. |
| `remotive` | Public job API | none | always | Remote jobs source, keyword based with bounded fallback phrases. |
| `remotejobs` | Public job API | none | always | RemoteJobs.org remote jobs API, preview-only and no API key required. |
| `himalayas` | Public job API | none | always | Himalayas Remote Jobs API, preview-only and no API key required. |
| `remoteok` | Public job API | none | always | Remote OK public JSON feed, preview-only and no API key required. Requires direct source link and attribution. |
| `adzuna` | Official API | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | both values are set | Leave empty to skip safely. Uses bounded fallback phrases when configured. |
| `greenhouse` | Company ATS boards | `GREENHOUSE_BOARD_TOKENS` | at least one board token is set | Comma-separated company board tokens; token is used as company fallback. |
| `lever` | Company ATS postings | `LEVER_SITE_NAMES` | at least one site name is set | Comma-separated company site names; site name is used as company fallback. |
| `stepstone` | Registry only | none | not runnable | No adapter implemented. |
| `indeed` | Registry only | none | not runnable | No adapter implemented. |
| `linkedin` | Registry only | none | not runnable | No adapter implemented. |
| `xing` | Registry only | none | not runnable | No adapter implemented. |

## Server Env

Set these only in the server-local env file:

```bash
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
GREENHOUSE_BOARD_TOKENS=
LEVER_SITE_NAMES=
```

Examples are intentionally blank in `deploy/backend.env.example`.

For Greenhouse, tokens are the public board names used in URLs like:

```text
https://boards.greenhouse.io/<board-token>
```

For Lever, site names are the public company names used in URLs like:

```text
https://jobs.lever.co/<site-name>
```

Use comma-separated values for multiple companies:

```bash
GREENHOUSE_BOARD_TOKENS=company-a,company-b
LEVER_SITE_NAMES=company-c,company-d
```

Do not put private credentials, internal-only URLs, or customer data into these
lists.

## Runtime Status Check

After changing server env and restarting the API container, verify configuration
without exposing secrets:

```bash
curl -i https://api.example.com/api/v1/discovery-sources/runtime-status
```

Expected shape:

```json
{
  "items": [
    {
      "source_id": "adzuna",
      "name": "Adzuna Germany",
      "automatic_discovery": true,
      "configured": false,
      "runnable": false,
      "configuration_status": "not_configured",
      "message_code": "adzuna_not_configured"
    }
  ]
}
```

This endpoint must never return key values, token lists, or raw env values.

You can also check the same status from inside the backend container:

```bash
python -m scripts.check_discovery_source_status
```

To fail the command when a specific source is not runnable:

```bash
python -m scripts.check_discovery_source_status --require arbeitsagentur --require remotive
```

In Docker Compose, run the same check through the production `api` service:

```bash
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status
```

The command prints only source ids, status flags, and message codes. It must not
print API keys, company token lists, or raw env values.

## UI Behavior

`/dashboard/matches` and Loop settings use runtime status to show:

- `ready`: preview can run for that source.
- `not_configured`: the source is selected but needs server-side configuration.
- `not_runnable`: the source is known but no safe adapter is enabled.

If the status endpoint is unavailable, the UI keeps a safe fallback and does not
block manual work.

## Safety Boundary

Source adapters are bounded preview adapters only:

- no website scraping
- no browser automation
- no login flow
- no scheduler
- no bulk persistence
- no automatic Application creation
- no unbounded pagination or mass result collection

Public API adapters may use up to a tiny number of fallback search phrases for
the same source when the first phrase is too narrow. The page size remains five
items per source page, and the UI requests the next five only when the user
scrolls or asks for more.

In broad mode, Arbeitsagentur may also try one bounded fallback without the
Loop location after location-specific queries. This helps sparse city searches
while still returning at most five preview items.

For page-based public feeds such as Arbeitnow, the adapter may inspect a tiny
fixed source-page window for the requested preview page, then still returns at
most five preview items. This improves sparse matching without turning preview
into unbounded collection.

Preview items are temporary. A user must explicitly save one item as a Vacancy
Match, and then explicitly create an Application from that saved match.

## Adding Another Source

Add a source only through the safe adapter path:

1. Add or update the Discovery Source Registry entry.
2. Implement one adapter with tiny limits, timeout handling, and sanitized
   preview item mapping.
3. Add runtime status rules if the source needs server configuration.
4. Add mocked tests. Do not use live network in tests.
5. Document env names and safety boundaries.
6. Keep persistence explicit and user-triggered.
