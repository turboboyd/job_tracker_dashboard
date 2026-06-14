"""DEV/QA seed script: populate the local database with deterministic QA data.

This creates a small, realistic dataset owned by a single dev-QA user so the
dashboard can be exercised in the browser against the Firebase Auth Emulator
(see Stage 5a/5b). It writes ONLY to a local development database and never
deletes or overwrites data belonging to other users.

Usage (run from the backend/ directory with the virtualenv active):

    Dry-run — prints the plan, writes nothing (default):
        ENVIRONMENT=development python -m scripts.seed_dev_qa

    Apply — upserts rows into the local dev database:
        ENVIRONMENT=development python -m scripts.seed_dev_qa --apply

Environment:
    DATABASE_URL          Must point at the LOCAL dev database. The script
                          refuses any non-local host.
    ENVIRONMENT           Must be "development".
    DEV_QA_FIREBASE_UID   The Firebase Auth Emulator user's UID. The seeded
                          User.firebase_uid is set to this value. If unset, the
                          documented fallback "dev-qa-user" is used (with a
                          warning). The emulator user MUST be created with this
                          exact UID so that, when the frontend signs in via the
                          emulator, the backend's ensure_local_user resolves the
                          seeded row and all seeded data is owned by that login.

Safety:
    - Refuses unless ENVIRONMENT=development AND DATABASE_URL host is local
      (localhost / 127.0.0.1 / ::1 / db).
    - Default run is a non-mutating dry-run; --apply is required to write.
    - Idempotent: deterministic UUIDv5 ids + get-or-update upsert. Running
      twice does not duplicate any row.
    - No deletes. No service-layer calls (direct ORM inserts only). No real
      Firebase credentials required. All writes are scoped to the dev-QA user.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import uuid
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ── Constants ────────────────────────────────────────────────────────────────

# Stable namespace for deterministic seed ids. Bumping the version suffix would
# produce a fresh, independent dataset.
SEED_NS = uuid.uuid5(uuid.NAMESPACE_DNS, "job-tracker.dev-qa-seed.v1")

FALLBACK_FIREBASE_UID = "dev-qa-user"

_LOCAL_DB_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "db"})

LOOP_A_KEY = "loop:frontend"
LOOP_B_KEY = "loop:backend"

# VacancyMatch.status values that count toward the "saved" badge.
_SAVED_STATUSES = frozenset({"saved", "converted"})


class SeedGuardError(RuntimeError):
    """Raised when the runtime target is not a safe local development database."""


def _sid(key: str) -> uuid.UUID:
    """Deterministic UUIDv5 for a logical seed key."""
    return uuid.uuid5(SEED_NS, key)


# ── Safety guards (pure, importable without a DB) ──────────────────────────────


def is_local_db_host(database_url: str) -> bool:
    """True iff DATABASE_URL points at a recognised local development host."""
    try:
        host = make_url(database_url).host
    except Exception:
        return False
    return host is not None and host in _LOCAL_DB_HOSTS


def assert_local_dev_target(is_development: bool, database_url: str) -> None:
    """Refuse to proceed unless this is a local development database.

    Raises SeedGuardError with an actionable message otherwise.
    """
    if not is_development:
        raise SeedGuardError(
            "Refusing to seed: ENVIRONMENT is not 'development'. This script "
            "only runs against a local development database."
        )
    if not is_local_db_host(database_url):
        try:
            host = make_url(database_url).host
        except Exception:
            host = None
        raise SeedGuardError(
            f"Refusing to seed: DATABASE_URL host {host!r} is not local. "
            f"Allowed hosts: {', '.join(sorted(_LOCAL_DB_HOSTS))}."
        )


def assert_safe_reset_uid(firebase_uid: str) -> None:
    """Refuse to reset unless the target firebase_uid is concrete and non-empty.

    Reset deletes by exact firebase_uid only; an empty/blank value could match
    nothing safely but signals a misconfiguration, so we stop rather than guess.
    """
    if not firebase_uid or not firebase_uid.strip():
        raise SeedGuardError(
            "Refusing to reset: resolved dev-QA firebase_uid is empty. "
            "Set DEV_QA_FIREBASE_UID or rely on the documented fallback."
        )


# ── Seed plan (pure data, importable without a DB) ─────────────────────────────


@dataclass(frozen=True)
class UserSeed:
    id: uuid.UUID
    firebase_uid: str
    email: str
    display_name: str
    language: str = "ru"


@dataclass(frozen=True)
class LoopSeed:
    id: uuid.UUID
    key: str
    title: str
    target_role: str
    location: str | None
    status: str
    auto_discovery_enabled: bool
    discovery_interval_hours: int
    selected_sources: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ApplicationSeed:
    id: uuid.UUID
    key: str
    loop_key: str
    company_name: str
    role_title: str
    status: str
    source: str | None
    applied_at: datetime | None
    applied_via: str | None


@dataclass(frozen=True)
class MatchSeed:
    id: uuid.UUID
    loop_key: str
    status: str
    source: str
    source_url: str
    external_id: str
    company_name: str
    role_title: str
    location_text: str | None
    posted_at: datetime | None
    seen_at: datetime | None
    created_at: datetime
    updated_at: datetime
    application_key: str | None = None


@dataclass(frozen=True)
class SeedPlan:
    user: UserSeed
    loops: list[LoopSeed]
    applications: list[ApplicationSeed]
    matches: list[MatchSeed]

    def matches_for(self, loop_key: str) -> list[MatchSeed]:
        return [m for m in self.matches if m.loop_key == loop_key]


def build_seed_plan(firebase_uid: str, now: datetime) -> SeedPlan:
    """Build the deterministic dev-QA dataset.

    `now` is injected so the dataset (and its tests) are reproducible.
    """
    user = UserSeed(
        id=_sid("user"),
        firebase_uid=firebase_uid,
        email="dev-qa@example.com",
        display_name="Dev QA User",
    )

    loop_a = LoopSeed(
        id=_sid(LOOP_A_KEY),
        key=LOOP_A_KEY,
        title="Frontend / Sales — QA",
        target_role="Frontend Developer",
        location="Berlin",
        status="active",
        # Disabled so the live scheduler does not flood the loop with real
        # discovery matches and destroy the deterministic QA dataset.
        auto_discovery_enabled=False,
        discovery_interval_hours=4,
        selected_sources=["arbeitsagentur", "remotive", "greenhouse", "lever"],
        keywords=["react", "typescript", "sales"],
    )
    loop_b = LoopSeed(
        id=_sid(LOOP_B_KEY),
        key=LOOP_B_KEY,
        title="Backend / Developer — QA",
        target_role="Backend Developer",
        location="Remote",
        status="active",
        # Disabled for the same reason as Loop A — keep the dataset stable.
        auto_discovery_enabled=False,
        discovery_interval_hours=4,
        selected_sources=["arbeitsagentur", "greenhouse"],
        keywords=["python", "fastapi"],
    )

    applications = [
        ApplicationSeed(
            id=_sid("app:interview"),
            key="app:interview",
            loop_key=LOOP_A_KEY,
            company_name="Globex",
            role_title="Senior Frontend Engineer",
            status="INTERVIEW_1",
            source="lever",
            applied_at=now - timedelta(days=9),
            applied_via="company_site",
        ),
        ApplicationSeed(
            id=_sid("app:applied"),
            key="app:applied",
            loop_key=LOOP_A_KEY,
            company_name="Initech",
            role_title="Frontend Engineer",
            status="APPLIED",
            source="linkedin",
            applied_at=now - timedelta(days=3),
            applied_via="linkedin",
        ),
    ]

    # (n, status, source, posted_offset, seen, application_key)
    # posted_offset=None => posted_at is NULL (freshness NULLS LAST / COALESCE).
    loop_a_specs: list[tuple[int, str, str, timedelta | None, bool, str | None]] = [
        (1, "new", "greenhouse", timedelta(hours=1), False, None),
        (2, "new", "arbeitsagentur", timedelta(hours=2), False, None),
        (3, "new", "arbeitsagentur", timedelta(hours=5), True, None),
        (4, "saved", "remotive", timedelta(days=2), True, None),
        (5, "new", "greenhouse", timedelta(days=10), False, None),
        (6, "saved", "remotive", timedelta(days=30), True, None),
        (7, "converted", "lever", None, True, "app:interview"),
    ]

    matches: list[MatchSeed] = []
    for n, status, source, offset, seen, app_key in loop_a_specs:
        posted_at = None if offset is None else now - offset
        # For the null-posted row, give created_at a concrete recent value so
        # the COALESCE(posted_at, created_at) fallback has something to use.
        created_at = posted_at if posted_at is not None else now - timedelta(hours=4)
        matches.append(
            MatchSeed(
                id=_sid(f"match:a:{n}"),
                loop_key=LOOP_A_KEY,
                status=status,
                source=source,
                source_url=f"https://example.com/jobs/a/{n}",
                external_id=f"dev-qa-a-{n}",
                company_name=f"Acme Frontend {n}",
                role_title="React Engineer",
                location_text="Berlin",
                posted_at=posted_at,
                seen_at=now if seen else None,
                created_at=created_at,
                updated_at=now,
                application_key=app_key,
            )
        )

    # Loop B: a single match to verify cross-loop filtering does not bleed into A.
    b_posted = now - timedelta(hours=3)
    matches.append(
        MatchSeed(
            id=_sid("match:b:1"),
            loop_key=LOOP_B_KEY,
            status="new",
            source="arbeitsagentur",
            source_url="https://example.com/jobs/b/1",
            external_id="dev-qa-b-1",
            company_name="Acme Backend 1",
            role_title="Python Engineer",
            location_text="Remote",
            posted_at=b_posted,
            seen_at=None,
            created_at=b_posted,
            updated_at=now,
            application_key=None,
        )
    )

    return SeedPlan(
        user=user,
        loops=[loop_a, loop_b],
        applications=applications,
        matches=matches,
    )


def plan_summary(plan: SeedPlan) -> str:
    """Human-readable summary of the intended dataset (no DB access)."""
    lines = [
        f"dev-QA user: firebase_uid={plan.user.firebase_uid!r} id={plan.user.id}",
        f"loops: {len(plan.loops)}",
    ]
    for loop in plan.loops:
        loop_matches = plan.matches_for(loop.key)
        status_counts = Counter(m.status for m in loop_matches)
        saved_count = sum(
            1 for m in loop_matches if m.status in _SAVED_STATUSES
        )
        lines.append(
            f"  - {loop.title!r}: matches={len(loop_matches)} "
            f"statuses={dict(sorted(status_counts.items()))} "
            f"saved+converted={saved_count}"
        )
    lines.append(f"applications: {len(plan.applications)}")
    for app in plan.applications:
        lines.append(f"  - {app.company_name!r} status={app.status}")
    lines.append(f"matches (total): {len(plan.matches)}")
    return "\n".join(lines)


# ── Apply (DB writes) ──────────────────────────────────────────────────────────


async def _upsert_user(session: AsyncSession, seed: UserSeed):
    from app.db.models.user import User

    # Reconcile by firebase_uid first to avoid a unique-key violation against a
    # row that ensure_local_user may already have created for this UID.
    existing = (
        await session.execute(select(User).where(User.firebase_uid == seed.firebase_uid))
    ).scalar_one_or_none()
    if existing is None:
        existing = await session.get(User, seed.id)

    if existing is None:
        user = User(
            id=seed.id,
            firebase_uid=seed.firebase_uid,
            email=seed.email,
            display_name=seed.display_name,
            language=seed.language,
        )
        session.add(user)
        return user, True

    existing.firebase_uid = seed.firebase_uid
    existing.email = seed.email
    existing.display_name = seed.display_name
    existing.language = seed.language
    return existing, False


async def _upsert_loop(session: AsyncSession, seed: LoopSeed, user_id: uuid.UUID):
    from app.db.models.loop import Loop

    loop = await session.get(Loop, seed.id)
    fields = {
        "user_id": user_id,
        "title": seed.title,
        "target_role": seed.target_role,
        "location": seed.location,
        "status": seed.status,
        "auto_discovery_enabled": seed.auto_discovery_enabled,
        "discovery_interval_hours": seed.discovery_interval_hours,
        "selected_sources": list(seed.selected_sources),
        "sources": list(seed.selected_sources),
        "keywords": list(seed.keywords),
    }
    if loop is None:
        loop = Loop(id=seed.id, **fields)
        session.add(loop)
        return loop, True
    for key, value in fields.items():
        setattr(loop, key, value)
    return loop, False


async def _upsert_application(
    session: AsyncSession, seed: ApplicationSeed, user_id: uuid.UUID, loop_id: str
):
    from app.db.models.application import Application

    app = await session.get(Application, seed.id)
    fields = {
        "user_id": user_id,
        "company_name": seed.company_name,
        "role_title": seed.role_title,
        "status": seed.status,
        "source": seed.source,
        "applied_at": seed.applied_at,
        "applied_via": seed.applied_via,
        "loop_id": loop_id,
        "has_loop": True,
    }
    if app is None:
        app = Application(id=seed.id, **fields)
        session.add(app)
        return app, True
    for key, value in fields.items():
        setattr(app, key, value)
    return app, False


async def _upsert_match(
    session: AsyncSession,
    seed: MatchSeed,
    user_id: uuid.UUID,
    loop,  # noqa: ANN001 - ORM Loop
    application_id: uuid.UUID | None,
):
    from app.db.models.vacancy_match import VacancyMatch
    from app.modules.vacancy_matches.scoring import (
        ScoreInput,
        score_match,
    )

    # Deterministic score from the real scoring core: seed inputs are fixed, so
    # the same plan always yields the same scores (useful for sort=score QA).
    result = score_match(
        loop,
        ScoreInput(
            role_title=seed.role_title,
            company_name=seed.company_name,
            location_text=seed.location_text,
            description=None,
            source=seed.source,
        ),
    )

    match = await session.get(VacancyMatch, seed.id)
    fields = {
        "user_id": user_id,
        "loop_id": str(loop.id),
        "source_url": seed.source_url,
        "source": seed.source,
        "external_id": seed.external_id,
        "company_name": seed.company_name,
        "role_title": seed.role_title,
        "location_text": seed.location_text,
        "status": seed.status,
        "application_id": application_id,
        "posted_at": seed.posted_at,
        "seen_at": seed.seen_at,
        "created_at": seed.created_at,
        "updated_at": seed.updated_at,
        "score": result.total,
        "score_version": result.version,
        "score_details": result.details_dict(),
    }
    if match is None:
        match = VacancyMatch(id=seed.id, **fields)
        session.add(match)
        return match, True
    for key, value in fields.items():
        setattr(match, key, value)
    return match, False


async def apply_seed_plan(session: AsyncSession, plan: SeedPlan) -> dict[str, int]:
    """Upsert the whole plan in dependency order. Returns created/updated tallies."""
    created = 0
    updated = 0

    user, was_created = await _upsert_user(session, plan.user)
    created += was_created
    updated += not was_created
    user_id = user.id

    loop_by_key: dict[str, object] = {}
    for loop_seed in plan.loops:
        loop, was_created = await _upsert_loop(session, loop_seed, user_id)
        loop_by_key[loop_seed.key] = loop
        created += was_created
        updated += not was_created

    # Applications must exist (and be flushed) before matches reference them.
    app_id_by_key: dict[str, uuid.UUID] = {}
    for app_seed in plan.applications:
        app, was_created = await _upsert_application(
            session, app_seed, user_id, str(loop_by_key[app_seed.loop_key].id)
        )
        app_id_by_key[app_seed.key] = app.id
        created += was_created
        updated += not was_created
    await session.flush()

    for match_seed in plan.matches:
        application_id = (
            app_id_by_key[match_seed.application_key]
            if match_seed.application_key is not None
            else None
        )
        _, was_created = await _upsert_match(
            session,
            match_seed,
            user_id,
            loop_by_key[match_seed.loop_key],
            application_id,
        )
        created += was_created
        updated += not was_created

    return {"created": created, "updated": updated}


# ── Reset (scoped deletes) ─────────────────────────────────────────────────────

# Ordered table names deleted by reset, parents-before-owner. Listed for tests
# and for the human-readable preview.
RESET_TABLE_ORDER = ("vacancy_matches", "applications", "loops", "users")


def build_reset_statements(user_id: uuid.UUID) -> list[tuple[str, object]]:
    """Ordered DELETE statements that remove every row owned by one user.

    Each statement is filtered by the resolved user id (or, for the user row
    itself, by its primary key). There is deliberately NO path that deletes by
    email or display name — only by the user identified via exact firebase_uid.
    DB-level ON DELETE CASCADE handles dependent rows (history, documents,
    analyses, discovery runs, preview cache, activity events).
    """
    from app.db.models.application import Application
    from app.db.models.loop import Loop
    from app.db.models.user import User
    from app.db.models.vacancy_match import VacancyMatch

    return [
        ("vacancy_matches", delete(VacancyMatch).where(VacancyMatch.user_id == user_id)),
        ("applications", delete(Application).where(Application.user_id == user_id)),
        ("loops", delete(Loop).where(Loop.user_id == user_id)),
        ("users", delete(User).where(User.id == user_id)),
    ]


async def _resolve_user_id(session: AsyncSession, firebase_uid: str) -> uuid.UUID | None:
    from app.db.models.user import User

    return (
        await session.execute(select(User.id).where(User.firebase_uid == firebase_uid))
    ).scalar_one_or_none()


async def preview_reset(session: AsyncSession, firebase_uid: str) -> dict[str, int | bool]:
    """Count, but do not delete, the rows a reset would remove for this user."""
    from app.db.models.application import Application
    from app.db.models.loop import Loop
    from app.db.models.vacancy_match import VacancyMatch

    user_id = await _resolve_user_id(session, firebase_uid)
    if user_id is None:
        return {"user_found": False, "vacancy_matches": 0, "applications": 0, "loops": 0}

    async def _count(model) -> int:
        return (
            await session.execute(
                select(func.count()).select_from(model).where(model.user_id == user_id)
            )
        ).scalar_one()

    return {
        "user_found": True,
        "vacancy_matches": await _count(VacancyMatch),
        "applications": await _count(Application),
        "loops": await _count(Loop),
    }


async def reset_dev_qa(session: AsyncSession, firebase_uid: str) -> dict[str, int]:
    """Delete every row owned by the dev-QA user (scoped by exact firebase_uid)."""
    user_id = await _resolve_user_id(session, firebase_uid)
    if user_id is None:
        return dict.fromkeys(RESET_TABLE_ORDER, 0)

    deleted: dict[str, int] = {}
    for name, stmt in build_reset_statements(user_id):
        result = await session.execute(stmt)
        deleted[name] = result.rowcount or 0
    return deleted


def reset_summary(firebase_uid: str, counts: dict[str, int | bool]) -> str:
    if not counts.get("user_found"):
        return (
            f"Reset target firebase_uid={firebase_uid!r}: no matching user — "
            f"nothing to delete."
        )
    return "\n".join(
        [
            f"Reset target firebase_uid={firebase_uid!r}:",
            f"  vacancy_matches: {counts['vacancy_matches']}",
            f"  applications:    {counts['applications']}",
            f"  loops:           {counts['loops']}",
            "  users:           1 (the dev-QA user row itself)",
        ]
    )


def _create_engine_from_settings():
    from app.core.config import get_settings

    return create_async_engine(
        get_settings().DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )


# ── CLI ────────────────────────────────────────────────────────────────────────


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed deterministic dev-QA data into the local database.",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--apply",
        action="store_true",
        help="Write the seed data. Without this flag the script only prints the plan.",
    )
    group.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the plan and write nothing (this is the default).",
    )
    parser.add_argument(
        "--reset-dev-qa",
        action="store_true",
        help=(
            "Delete ALL data owned by the dev-QA user (resolved by exact "
            "firebase_uid). Requires --apply to actually delete; without it, "
            "prints what would be deleted. Does not re-seed."
        ),
    )
    return parser.parse_args(argv)


def _resolve_firebase_uid() -> str:
    uid = os.environ.get("DEV_QA_FIREBASE_UID", "").strip()
    if uid:
        return uid
    print(
        f"WARNING: DEV_QA_FIREBASE_UID is not set — using fallback "
        f"{FALLBACK_FIREBASE_UID!r}. Create the Firebase Auth Emulator user with "
        f"this exact UID so the seeded data is owned by your emulator login."
    )
    return FALLBACK_FIREBASE_UID


async def _run_reset(args: argparse.Namespace, firebase_uid: str) -> int:
    engine = _create_engine_from_settings()
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with factory() as session:
            counts = await preview_reset(session, firebase_uid)
            print(reset_summary(firebase_uid, counts))

            if not args.apply:
                print(
                    "\nReset dry-run: nothing deleted. Re-run with "
                    "--reset-dev-qa --apply to delete."
                )
                return 0

            try:
                deleted = await reset_dev_qa(session, firebase_uid)
                await session.commit()
            except Exception:
                await session.rollback()
                raise
    finally:
        await engine.dispose()

    total = sum(deleted.values())
    print(
        f"\nReset applied: deleted {total} rows "
        f"(matches={deleted['vacancy_matches']}, applications={deleted['applications']}, "
        f"loops={deleted['loops']}, users={deleted['users']})."
    )
    return 0


async def _run(args: argparse.Namespace) -> int:
    from app.core.config import get_settings

    settings = get_settings()
    assert_local_dev_target(settings.is_development, settings.DATABASE_URL)

    firebase_uid = _resolve_firebase_uid()

    if args.reset_dev_qa:
        assert_safe_reset_uid(firebase_uid)
        return await _run_reset(args, firebase_uid)

    plan = build_seed_plan(firebase_uid, datetime.now(UTC))

    print(plan_summary(plan))

    if not args.apply:
        print("\nDry-run: no rows were written. Re-run with --apply to write.")
        return 0

    engine = _create_engine_from_settings()
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with factory() as session:
            try:
                tally = await apply_seed_plan(session, plan)
                await session.commit()
            except Exception:
                await session.rollback()
                raise
    finally:
        await engine.dispose()

    print(f"\nApplied: created={tally['created']} updated={tally['updated']}")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(argv)
    return asyncio.run(_run(args))


if __name__ == "__main__":
    raise SystemExit(main())
