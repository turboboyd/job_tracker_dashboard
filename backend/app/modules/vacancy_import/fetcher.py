from __future__ import annotations

import httpx

MAX_VACANCY_IMPORT_RESPONSE_BYTES = 2 * 1024 * 1024
VACANCY_IMPORT_TIMEOUT_SECONDS = 7.0
VACANCY_IMPORT_USER_AGENT = (
    "job-tracker-dashboard vacancy preview importer/1.0 "
    "(+single user supplied URL)"
)


class VacancyImportFetchError(RuntimeError):
    pass


async def fetch_vacancy_html(url: str) -> str:
    headers = {
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "User-Agent": VACANCY_IMPORT_USER_AGENT,
    }
    timeout = httpx.Timeout(VACANCY_IMPORT_TIMEOUT_SECONDS)

    async with (
        httpx.AsyncClient(timeout=timeout, follow_redirects=True, max_redirects=3) as client,
        client.stream("GET", url, headers=headers) as response,
    ):
        response.raise_for_status()
        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            raise VacancyImportFetchError("Vacancy URL did not return HTML")

        chunks: list[bytes] = []
        total = 0
        async for chunk in response.aiter_bytes():
            total += len(chunk)
            if total > MAX_VACANCY_IMPORT_RESPONSE_BYTES:
                raise VacancyImportFetchError("Vacancy page is too large")
            chunks.append(chunk)

        encoding = response.encoding or "utf-8"
        return b"".join(chunks).decode(encoding, errors="replace")
