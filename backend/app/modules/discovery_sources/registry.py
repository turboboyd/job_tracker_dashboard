from __future__ import annotations

from app.core.config import Settings
from app.modules.discovery_sources.schemas import (
    DiscoverySource,
    DiscoverySourceRuntimeStatus,
)


DISCOVERY_SOURCES: tuple[DiscoverySource, ...] = (
    DiscoverySource(
        id="manual_url",
        name="Manual URL",
        type="manual",
        enabled=True,
        description="User-provided vacancy URL. The system can keep the link and user-entered details.",
        countries=[],
        base_url=None,
        capabilities={
            "manual_import": True,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": False,
        },
    ),
    DiscoverySource(
        id="arbeitsagentur",
        name="Bundesagentur fuer Arbeit",
        type="job_board",
        enabled=True,
        description="German public job board source using a small, dry-run-only Jobsuche API adapter.",
        countries=["DE"],
        base_url="https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="stepstone",
        name="StepStone",
        type="job_board",
        enabled=True,
        description="Job board source definition. No fetching is implemented in F21.",
        countries=["DE"],
        base_url="https://www.stepstone.de/",
        capabilities={
            "manual_import": False,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="adzuna",
        name="Adzuna Germany",
        type="job_board",
        enabled=True,
        description="Official Adzuna jobs API adapter for Germany. Requires server-side ADZUNA_APP_ID and ADZUNA_APP_KEY.",
        countries=["DE"],
        base_url="https://api.adzuna.com/v1/api/jobs/de/search/1",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": True,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="arbeitnow",
        name="Arbeitnow",
        type="job_board",
        enabled=True,
        description="Public Europe and remote job board API adapter. Preview-only and no API key required.",
        countries=["DE"],
        base_url="https://www.arbeitnow.com/api/job-board-api",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="remotive",
        name="Remotive",
        type="job_board",
        enabled=True,
        description="Public remote jobs API adapter. Preview-only and attribution-aware.",
        countries=[],
        base_url="https://remotive.com/api/remote-jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="remotejobs",
        name="RemoteJobs.org",
        type="job_board",
        enabled=True,
        description="Public RemoteJobs.org API adapter. Preview-only, no API key required, and attribution-aware.",
        countries=[],
        base_url="https://remotejobs.org/api/v1/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="himalayas",
        name="Himalayas",
        type="job_board",
        enabled=True,
        description="Public Himalayas remote jobs API adapter. Preview-only, no API key required, and attribution-aware.",
        countries=[],
        base_url="https://himalayas.app/jobs/api/search",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="remoteok",
        name="Remote OK",
        type="job_board",
        enabled=True,
        description="Public Remote OK JSON feed adapter. Preview-only, no API key required, and attribution-aware.",
        countries=[],
        base_url="https://remoteok.com/api",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="greenhouse",
        name="Greenhouse company boards",
        type="company_site",
        enabled=True,
        description="Public Greenhouse Job Board API adapter for configured company board tokens.",
        countries=[],
        base_url="https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="lever",
        name="Lever company boards",
        type="company_site",
        enabled=True,
        description="Public Lever Postings API adapter for configured company site names.",
        countries=[],
        base_url="https://api.lever.co/v0/postings/{site}",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="indeed",
        name="Indeed",
        type="job_board",
        enabled=True,
        description="Job board source definition. No fetching is implemented in F21.",
        countries=["DE"],
        base_url="https://de.indeed.com/",
        capabilities={
            "manual_import": False,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="linkedin",
        name="LinkedIn",
        type="job_board",
        enabled=True,
        description="Professional network job source definition. No fetching is implemented in F21.",
        countries=[],
        base_url="https://www.linkedin.com/jobs/",
        capabilities={
            "manual_import": False,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="xing",
        name="Xing",
        type="job_board",
        enabled=True,
        description="Professional network job source definition. No fetching is implemented in F21.",
        countries=["DE"],
        base_url="https://www.xing.com/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
    DiscoverySource(
        id="company_websites",
        name="Company websites",
        type="company_site",
        enabled=True,
        description="Company career pages as a future source category. No fetching is implemented in F21.",
        countries=[],
        base_url=None,
        capabilities={
            "manual_import": False,
            "automatic_discovery": False,
            "requires_credentials": False,
            "supports_filters": True,
        },
    ),
)


def list_discovery_sources(*, enabled_only: bool = False) -> list[DiscoverySource]:
    if enabled_only:
        return [source for source in DISCOVERY_SOURCES if source.enabled]
    return list(DISCOVERY_SOURCES)


def get_discovery_source(source_id: str) -> DiscoverySource | None:
    for source in DISCOVERY_SOURCES:
        if source.id == source_id:
            return source
    return None


def get_discovery_source_ids() -> set[str]:
    return {source.id for source in DISCOVERY_SOURCES}


def list_discovery_source_runtime_statuses(
    settings: Settings,
) -> list[DiscoverySourceRuntimeStatus]:
    return [
        _build_runtime_status(source, settings)
        for source in DISCOVERY_SOURCES
        if source.enabled
    ]


def _build_runtime_status(
    source: DiscoverySource,
    settings: Settings,
) -> DiscoverySourceRuntimeStatus:
    automatic_discovery = source.capabilities.automatic_discovery
    configured = _is_source_configured(source.id, settings)
    runnable = automatic_discovery and configured

    if not automatic_discovery:
        status = "not_runnable"
        message_code = "automatic_discovery_not_available"
    elif not configured:
        status = "not_configured"
        message_code = f"{source.id}_not_configured"
    else:
        status = "ready"
        message_code = "source_ready"

    return DiscoverySourceRuntimeStatus(
        source_id=source.id,
        name=source.name,
        automatic_discovery=automatic_discovery,
        configured=configured,
        runnable=runnable,
        configuration_status=status,
        message_code=message_code,
    )


def _is_source_configured(source_id: str, settings: Settings) -> bool:
    if source_id == "adzuna":
        return bool(settings.ADZUNA_APP_ID.strip() and settings.ADZUNA_APP_KEY.strip())
    if source_id == "greenhouse":
        return bool(_csv_values(settings.GREENHOUSE_BOARD_TOKENS))
    if source_id == "lever":
        return bool(_csv_values(settings.LEVER_SITE_NAMES))
    return True


def _csv_values(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]
