"""One-time migration script: Firestore application data → PostgreSQL.

Usage (run from the backend/ directory with the virtualenv active):

  Dry-run — reads Firestore, prints plan, writes nothing:
    python -m scripts.migrate_firestore_to_postgres \\
        --firebase-uid <UID> --dry-run

  Apply — writes to PostgreSQL:
    python -m scripts.migrate_firestore_to_postgres \\
        --firebase-uid <UID> --apply

  Include history subcollection (default: applications only):
    python -m scripts.migrate_firestore_to_postgres \\
        --firebase-uid <UID> --apply --include-history

Requirements:
  - backend/.env must set FIREBASE_CREDENTIALS_JSON_PATH and DATABASE_URL.
  - The service-account JSON must belong to the same Firebase project as the
    frontend app (see src/shared/config/firebase/app.ts).
  - Run `alembic upgrade head` before the first apply.

Safety notes:
  - --dry-run and --apply are mutually exclusive.
  - Omitting both flags is an error.
  - Idempotent: already-migrated documents (tracked in firestore_migration_log)
    are skipped on subsequent runs.
  - Each application is committed in its own transaction; a failure on one
    document does not roll back others.
"""

from __future__ import annotations

import argparse
import asyncio
import dataclasses
import logging
import pathlib
import sys
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

logger = logging.getLogger(__name__)

# ── Pure helper functions (importable and testable without DB or Firebase) ─────


def _ts_to_dt(v: Any) -> datetime | None:
    """Convert a Firestore Timestamp (or already-aware datetime) to UTC datetime.

    The Firestore Admin SDK returns DatetimeWithNanoseconds (a datetime subclass)
    with UTC timezone already set. Plain datetime objects are accepted for tests.
    Objects that expose a to_datetime() method (e.g. google.protobuf Timestamp)
    are also handled as a defensive fallback.
    """
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v
    if hasattr(v, "to_datetime"):
        return v.to_datetime(timezone.utc)
    return None


def _serialize_jsonb(v: Any) -> Any:
    """Recursively convert datetime objects to ISO strings for JSONB storage.

    asyncpg serializes JSONB via json.dumps, which does not handle datetime
    natively. This converts any nested datetime to an ISO 8601 string.
    """
    if isinstance(v, datetime):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v.isoformat()
    if isinstance(v, list):
        return [_serialize_jsonb(item) for item in v]
    if isinstance(v, dict):
        return {k: _serialize_jsonb(val) for k, val in v.items()}
    return v


def map_firestore_doc_to_application_dict(
    doc_data: dict,
    user_id: UUID,
) -> dict:
    """Map a Firestore ApplicationDoc dict to kwargs for the Application ORM model.

    Rules:
    - Caller must invoke apply_derived(result) afterwards to fill computed fields
      (stage, needs_follow_up, follow_up_due_at, needs_reapply_suggestion,
      reapply_eligible_at). Firestore-stored values for those fields are ignored.
    - id is not set here — SQLAlchemy generates it.
    - Dropped Firestore fields: matching, priority, integrations, createdBy,
      job.companyId, loopLinkage.platform/matchedAt/source/legacyMatchId.
    - Tags: notes.tags is preferred over the top-level tags field.
    """
    job = doc_data.get("job") or {}
    process = doc_data.get("process") or {}
    notes = doc_data.get("notes") or {}
    vacancy = doc_data.get("vacancy") or {}
    loop_linkage = doc_data.get("loopLinkage") or {}
    cv_linkage = doc_data.get("cvLinkage") or {}

    # Tags: notes.tags wins (even if empty list); fall back to top-level tags
    notes_tags = notes.get("tags")
    tags: list | None = notes_tags if notes_tags is not None else doc_data.get("tags")

    # Reminders: convert each at-Timestamp to ISO string for JSONB storage
    raw_reminders = process.get("reminders")
    reminders: list | None = None
    if raw_reminders:
        reminders = _serialize_jsonb(
            [
                {
                    "id": r.get("id", ""),
                    "at": _ts_to_dt(r.get("at")),
                    "text": r.get("text"),
                }
                for r in raw_reminders
            ]
        )

    now = datetime.now(timezone.utc)

    return {
        "user_id": user_id,
        "archived": bool(doc_data.get("archived", False)),
        # Job
        "company_name": job.get("companyName") or "",
        "role_title": job.get("roleTitle") or "",
        "location_text": job.get("locationText"),
        "vacancy_url": job.get("vacancyUrl"),
        "source": job.get("source"),
        "employment_type": job.get("employmentType"),
        "work_mode": job.get("workMode"),
        "salary": _serialize_jsonb(job.get("salary")),
        "posted_at": _ts_to_dt(job.get("postedAt")),
        # Process — stage/follow-up/reapply fields are intentionally absent here;
        # they are filled by apply_derived() after this function returns.
        "status": process.get("status") or "SAVED",
        "sub_status": process.get("subStatus"),
        "last_status_change_at": _ts_to_dt(process.get("lastStatusChangeAt")) or now,
        "applied_at": _ts_to_dt(process.get("appliedAt")),
        "applied_via": process.get("appliedVia"),
        "next_action_at": _ts_to_dt(process.get("nextActionAt")),
        "next_action_text": process.get("nextActionText"),
        "contact_attempts": int(process.get("contactAttempts") or 0),
        "last_contact_at": _ts_to_dt(process.get("lastContactAt")),
        "last_follow_up_at": _ts_to_dt(process.get("lastFollowUpAt")),
        "follow_up_level": int(process.get("followUpLevel") or 0),
        "reapply_reason": process.get("reapplyReason"),
        "reminders": reminders,
        # Notes
        "current_note": notes.get("currentNote"),
        "tags": tags,
        # Vacancy
        "vacancy_description": vacancy.get("rawDescription"),
        "role_fingerprint": vacancy.get("roleFingerprint"),
        # Linkage
        "loop_id": loop_linkage.get("loopId"),
        "has_loop": bool(doc_data.get("hasLoop", False)),
        "cv_version_id": cv_linkage.get("cvVersionId"),
        "profile_version_id": cv_linkage.get("profileVersionId"),
        # Timestamps — preserve originals from Firestore
        "created_at": _ts_to_dt(doc_data.get("createdAt")) or now,
        "updated_at": _ts_to_dt(doc_data.get("updatedAt")) or now,
    }


def map_firestore_history_to_dict(
    hist_data: dict,
    application_id: UUID,
    user_id: UUID,
) -> dict:
    """Map a Firestore HistoryEventDoc dict to kwargs for ApplicationHistory."""
    return {
        "application_id": application_id,
        "user_id": user_id,
        "actor": hist_data.get("actor") or "user",
        "type": hist_data.get("type") or "SYSTEM",
        "from_status": hist_data.get("fromStatus"),
        "to_status": hist_data.get("toStatus"),
        "field_path": hist_data.get("fieldPath"),
        "old_value": _serialize_jsonb(hist_data.get("oldValue")),
        "new_value": _serialize_jsonb(hist_data.get("newValue")),
        "comment": hist_data.get("comment"),
        "feedback_type": hist_data.get("feedbackType"),
        "sentiment": hist_data.get("sentiment"),
        "rejection_reason_code": hist_data.get("rejectionReasonCode"),
        "correlation_id": hist_data.get("correlationId"),
        "created_at": _ts_to_dt(hist_data.get("createdAt")) or datetime.now(timezone.utc),
    }


def is_already_migrated(migrated_ids: set[str], firestore_doc_id: str) -> bool:
    """Return True if this Firestore document was already imported."""
    return firestore_doc_id in migrated_ids


# ── Database helpers ───────────────────────────────────────────────────────────


async def _get_local_user(db: AsyncSession, firebase_uid: str):
    from app.db.models.user import User

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    return result.scalar_one_or_none()


async def _fetch_migrated_ids(db: AsyncSession, user_id: UUID) -> set[str]:
    from app.db.models.firestore_migration_log import FirestoreMigrationLog

    result = await db.execute(
        select(FirestoreMigrationLog.firestore_doc_id).where(
            FirestoreMigrationLog.user_id == user_id
        )
    )
    return {row[0] for row in result.all()}


# ── Firebase / session initialisation ─────────────────────────────────────────


def _init_firebase():
    """Initialise Firebase Admin SDK and return a Firestore client.

    Uses FIREBASE_CREDENTIALS_JSON_PATH from backend/.env via app settings.
    Does not read, print, or log the contents of the credentials file.
    """
    import firebase_admin
    from firebase_admin import credentials
    from firebase_admin import firestore as _firestore

    from app.core.config import get_settings

    settings = get_settings()
    cred_path = settings.FIREBASE_CREDENTIALS_JSON_PATH

    if not cred_path:
        sys.exit(
            "ERROR: FIREBASE_CREDENTIALS_JSON_PATH is not set.\n"
            "  Set it in backend/.env to point to your service-account JSON file.\n"
            "  See backend/README.md § Real Firebase Auth smoke test."
        )
    if not pathlib.Path(cred_path).exists():
        sys.exit(
            f"ERROR: service-account file not found: {cred_path!r}\n"
            "  Download it from Firebase Console → Project Settings → Service accounts."
        )

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    return _firestore.client()


def _build_session_factory() -> async_sessionmaker[AsyncSession]:
    from app.core.config import get_settings

    engine = create_async_engine(
        get_settings().DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── CLI argument parsing ───────────────────────────────────────────────────────


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate Firestore application data to PostgreSQL.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m scripts.migrate_firestore_to_postgres "
            "--firebase-uid <UID> --dry-run\n"
            "  python -m scripts.migrate_firestore_to_postgres "
            "--firebase-uid <UID> --apply\n"
            "  python -m scripts.migrate_firestore_to_postgres "
            "--firebase-uid <UID> --apply --include-history\n"
        ),
    )
    parser.add_argument(
        "--firebase-uid",
        required=True,
        metavar="UID",
        help="Firebase UID of the user whose data will be migrated.",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Read Firestore and print plan; write nothing to PostgreSQL.",
    )
    mode.add_argument(
        "--apply",
        action="store_true",
        help="Write migrated data to PostgreSQL.",
    )
    parser.add_argument(
        "--include-history",
        action="store_true",
        default=False,
        help="Also migrate the history subcollection for each application.",
    )
    return parser.parse_args(argv)


# ── Migration result ───────────────────────────────────────────────────────────


@dataclasses.dataclass
class MigrationResult:
    found: int = 0
    created: int = 0
    skipped: int = 0
    failed: int = 0
    errors: list[str] = dataclasses.field(default_factory=list)


# ── Core migration logic ───────────────────────────────────────────────────────


async def _run(args: argparse.Namespace) -> int:
    from app.db.models.application import Application
    from app.db.models.application_history import ApplicationHistory
    from app.db.models.firestore_migration_log import FirestoreMigrationLog
    from app.modules.applications.derived import apply_derived

    mode_label = "DRY-RUN" if args.dry_run else "APPLY"
    print(f"\n{'─' * 60}")
    print(f"  Firestore → PostgreSQL migration  [{mode_label}]")
    if args.include_history:
        print("  History subcollection: included (--include-history)")
    print(f"{'─' * 60}\n")

    # ── Init Firebase and DB ───────────────────────────────────────────────────
    firestore_db = _init_firebase()
    session_factory = _build_session_factory()

    # ── Resolve local user ─────────────────────────────────────────────────────
    async with session_factory() as db:
        pg_user = await _get_local_user(db, args.firebase_uid)

    if pg_user is None:
        print(f"ERROR: No local user found for firebase_uid={args.firebase_uid!r}")
        print("  Hint: call GET /api/v1/users/me with a valid Firebase ID token first.")
        print("  That endpoint creates the local user row on first call.")
        return 1

    print(f"Local user:  pg_id={pg_user.id}  firebase_uid={args.firebase_uid!r}")

    # ── Load already-migrated IDs ──────────────────────────────────────────────
    async with session_factory() as db:
        migrated_ids = await _fetch_migrated_ids(db, pg_user.id)

    if migrated_ids:
        print(f"Already migrated: {len(migrated_ids)} document(s) (will be skipped).\n")

    # ── Fetch Firestore application documents ──────────────────────────────────
    apps_col = (
        firestore_db
        .collection("users")
        .document(args.firebase_uid)
        .collection("applications")
    )
    print(f"Fetching Firestore applications for firebase_uid={args.firebase_uid!r} ...")
    docs = list(apps_col.stream())

    if not docs:
        print("No application documents found in Firestore.")
        return 0

    result = MigrationResult(found=len(docs))
    print(f"Found {result.found} document(s).\n")

    # ── Process each document ──────────────────────────────────────────────────
    for i, doc in enumerate(docs, 1):
        prefix = f"[{i:>{len(str(result.found))}}/ {result.found}]"
        doc_id: str = doc.id
        doc_data: dict = doc.to_dict() or {}

        if is_already_migrated(migrated_ids, doc_id):
            result.skipped += 1
            print(f"{prefix} SKIP    (already migrated)  firestore_id={doc_id}")
            continue

        # Map fields
        try:
            app_dict = map_firestore_doc_to_application_dict(doc_data, pg_user.id)
            apply_derived(app_dict)
        except Exception as exc:
            result.failed += 1
            result.errors.append(f"[{doc_id}] mapping error: {exc}")
            print(f"{prefix} ERROR   mapping {doc_id}: {exc}")
            continue

        label = (
            f"{app_dict.get('company_name', '?')} / "
            f"{app_dict.get('role_title', '?')} "
            f"({app_dict.get('status', '?')})"
        )

        if args.dry_run:
            result.created += 1
            print(f"{prefix} WOULD CREATE  {label}")
            if args.include_history:
                hist_count = sum(
                    1 for _ in apps_col.document(doc_id).collection("history").stream()
                )
                print(f"{'':>{len(prefix)}}   └─ {hist_count} history event(s) would be migrated")
        else:
            try:
                async with session_factory() as db:
                    app = Application(**app_dict)
                    db.add(app)
                    await db.flush()
                    await db.refresh(app)

                    log = FirestoreMigrationLog(
                        firestore_doc_id=doc_id,
                        user_id=pg_user.id,
                        postgres_application_id=app.id,
                    )
                    db.add(log)

                    history_count = 0
                    if args.include_history:
                        for hdoc in apps_col.document(doc_id).collection("history").stream():
                            hist_dict = map_firestore_history_to_dict(
                                hdoc.to_dict() or {}, app.id, pg_user.id
                            )
                            db.add(ApplicationHistory(**hist_dict))
                            history_count += 1

                    await db.commit()

                result.created += 1
                hist_info = f"  (+{history_count} history)" if args.include_history else ""
                print(f"{prefix} CREATED  {label}  pg_id={app.id}{hist_info}")

            except Exception as exc:
                result.failed += 1
                result.errors.append(f"[{doc_id}] write error: {exc}")
                print(f"{prefix} ERROR   inserting {doc_id}: {exc}")
                logger.exception("Failed to insert application firestore_id=%r", doc_id)

    # ── Summary ────────────────────────────────────────────────────────────────
    print(f"\n{'─' * 60}")
    print(f"  Summary  [{mode_label}]")
    print(f"{'─' * 60}")
    print(f"  Found:    {result.found}")
    if args.dry_run:
        print(f"  Would create: {result.created}")
    else:
        print(f"  Created:  {result.created}")
    print(f"  Skipped:  {result.skipped}")
    print(f"  Failed:   {result.failed}")

    if result.errors:
        print("\nErrors:")
        for err in result.errors:
            print(f"  {err}")

    return 1 if result.failed else 0


# ── Entry point ────────────────────────────────────────────────────────────────


def main() -> int:
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    args = _parse_args()
    return asyncio.run(_run(args))


if __name__ == "__main__":
    sys.exit(main())
