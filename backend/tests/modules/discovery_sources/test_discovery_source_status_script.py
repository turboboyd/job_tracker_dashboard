from __future__ import annotations

from app.core.config import get_settings
from scripts.check_discovery_source_status import (
    build_status_rows,
    find_missing_required_sources,
    format_status_table,
)


def test_status_script_formats_safe_status_without_secret_values() -> None:
    settings = get_settings().model_copy(
        update={
            "ADZUNA_APP_ID": "app-id",
            "ADZUNA_APP_KEY": "secret-key",
            "GREENHOUSE_BOARD_TOKENS": "company-a,company-b",
            "LEVER_SITE_NAMES": "",
        }
    )

    output = format_status_table(build_status_rows(settings))

    assert "adzuna | ready | yes | yes | source_ready" in output
    assert "greenhouse | ready | yes | yes | source_ready" in output
    assert "lever | not_configured | no | no | lever_not_configured" in output
    assert "secret-key" not in output
    assert "company-a" not in output
    assert "company-b" not in output


def test_status_script_finds_required_sources_that_are_not_runnable() -> None:
    settings = get_settings().model_copy(
        update={
            "ADZUNA_APP_ID": "",
            "ADZUNA_APP_KEY": "",
        }
    )
    rows = build_status_rows(settings)

    assert find_missing_required_sources(rows, ["arbeitsagentur", "adzuna"]) == [
        "adzuna"
    ]
