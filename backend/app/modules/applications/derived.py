"""Derived field computation for Application records.

All derived fields are recomputed on every create / update and stored in the
DB so they can be queried and indexed efficiently.
"""

from datetime import UTC, datetime, timedelta

# Maps ProcessStatus → ProcessStage
_STAGE_MAP: dict[str, str] = {
    "SAVED": "ACTIVE",
    "PLANNED": "ACTIVE",
    "APPLIED": "ACTIVE",
    "VIEWED": "ACTIVE",
    "INTERVIEW_1": "INTERVIEW",
    "INTERVIEW_2": "INTERVIEW",
    "TEST_TASK": "INTERVIEW",
    "OFFER": "OFFER",
    "HIRED": "HIRED",
    "REJECTED": "REJECTED",
    "NO_RESPONSE": "NO_RESPONSE",
    "WITHDREW": "ARCHIVED",
}

# Statuses for which follow-up tracking is relevant
_FOLLOW_UP_STATUSES = frozenset(
    {"APPLIED", "VIEWED", "INTERVIEW_1", "INTERVIEW_2", "TEST_TASK"}
)

# Days until the next follow-up nudge, keyed by follow_up_level
_FOLLOW_UP_DAYS: dict[int, int] = {0: 3, 1: 7, 2: 14}
_FOLLOW_UP_DEFAULT_DAYS = 21

# Statuses after which we may suggest reapplying
_REAPPLY_STATUSES = frozenset({"REJECTED", "NO_RESPONSE"})
_REAPPLY_WAIT_DAYS = 90


def compute_stage(status: str) -> str:
    return _STAGE_MAP.get(status, "ACTIVE")


def compute_follow_up(
    status: str,
    last_contact_at: datetime | None,
    follow_up_level: int,
) -> tuple[bool, datetime | None]:
    """Return (needs_follow_up, follow_up_due_at)."""
    if status not in _FOLLOW_UP_STATUSES or last_contact_at is None:
        return False, None
    days = _FOLLOW_UP_DAYS.get(follow_up_level, _FOLLOW_UP_DEFAULT_DAYS)
    due_at = last_contact_at + timedelta(days=days)
    return datetime.now(UTC) >= due_at, due_at


def compute_reapply(
    status: str,
    applied_at: datetime | None,
) -> tuple[bool, datetime | None]:
    """Return (needs_reapply_suggestion, reapply_eligible_at)."""
    if status not in _REAPPLY_STATUSES or applied_at is None:
        return False, None
    eligible_at = applied_at + timedelta(days=_REAPPLY_WAIT_DAYS)
    return datetime.now(UTC) >= eligible_at, eligible_at


def apply_derived(data: dict) -> dict:
    """Compute all derived fields and merge them into *data* in-place.

    Call before every INSERT or UPDATE. Reads: status, last_contact_at,
    follow_up_level, applied_at. Writes: stage, needs_follow_up,
    follow_up_due_at, needs_reapply_suggestion, reapply_eligible_at.
    """
    status = data.get("status", "SAVED")

    data["stage"] = compute_stage(status)

    needs_fu, fu_due = compute_follow_up(
        status,
        data.get("last_contact_at"),
        data.get("follow_up_level", 0),
    )
    data["needs_follow_up"] = needs_fu
    data["follow_up_due_at"] = fu_due

    needs_ra, ra_eligible = compute_reapply(status, data.get("applied_at"))
    data["needs_reapply_suggestion"] = needs_ra
    data["reapply_eligible_at"] = ra_eligible

    return data
