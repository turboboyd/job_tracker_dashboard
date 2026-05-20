"""Print safe runtime status for discovery source adapters.

Usage:
    python -m scripts.check_discovery_source_status
    python -m scripts.check_discovery_source_status --require arbeitsagentur --require remotive

The output intentionally contains only source ids and status flags. It must not
print env values, API keys, company token lists, or credentials.
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence

from app.core.config import Settings, get_settings
from app.modules.discovery_sources.registry import list_discovery_source_runtime_statuses
from app.modules.discovery_sources.schemas import DiscoverySourceRuntimeStatus


def build_status_rows(settings: Settings) -> list[DiscoverySourceRuntimeStatus]:
    return list_discovery_source_runtime_statuses(settings)


def format_status_table(rows: Sequence[DiscoverySourceRuntimeStatus]) -> str:
    header = "source_id | status | runnable | configured | message_code"
    separator = "-" * len(header)
    lines = [header, separator]

    for row in sorted(rows, key=lambda item: item.source_id):
        lines.append(
            " | ".join(
                [
                    row.source_id,
                    row.configuration_status,
                    _bool_text(row.runnable),
                    _bool_text(row.configured),
                    row.message_code,
                ]
            )
        )

    return "\n".join(lines)


def find_missing_required_sources(
    rows: Sequence[DiscoverySourceRuntimeStatus],
    required_sources: Sequence[str],
) -> list[str]:
    by_id = {row.source_id: row for row in rows}
    missing: list[str] = []

    for source_id in required_sources:
        row = by_id.get(source_id)
        if row is None or not row.runnable:
            missing.append(source_id)

    return missing


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Print safe discovery source runtime status.",
    )
    parser.add_argument(
        "--require",
        action="append",
        default=[],
        metavar="SOURCE_ID",
        help="Fail if the given source is not runnable. Can be passed more than once.",
    )
    args = parser.parse_args(argv)

    rows = build_status_rows(get_settings())
    print(format_status_table(rows))

    missing = find_missing_required_sources(rows, args.require)
    if missing:
        print()
        print("not_runnable_required_sources: " + ", ".join(missing))
        return 2

    return 0


def _bool_text(value: bool) -> str:
    return "yes" if value else "no"


if __name__ == "__main__":
    raise SystemExit(main())
