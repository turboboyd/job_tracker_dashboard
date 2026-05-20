from __future__ import annotations

import pytest

from app.modules.vacancy_import.validation import (
    VacancyImportValidationError,
    validate_vacancy_import_url,
)


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/job",
        "http://localhost/job",
        "http://localhost.localdomain/job",
        "http://127.0.0.1/job",
        "http://[::1]/job",
        "http://10.0.0.2/job",
        "http://172.16.0.10/job",
        "http://192.168.1.20/job",
        "http://169.254.169.254/latest/meta-data",
    ],
)
def test_validate_vacancy_import_url_rejects_internal_urls(url: str) -> None:
    with pytest.raises(VacancyImportValidationError):
        validate_vacancy_import_url(url, resolve_host=False)


def test_validate_vacancy_import_url_accepts_public_http_url_without_dns() -> None:
    assert (
        validate_vacancy_import_url(" https://example.com/jobs/1 ", resolve_host=False)
        == "https://example.com/jobs/1"
    )
