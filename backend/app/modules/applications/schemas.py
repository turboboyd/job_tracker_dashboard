from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

ProcessStatus = Literal[
    "SAVED",
    "PLANNED",
    "APPLIED",
    "VIEWED",
    "INTERVIEW_1",
    "INTERVIEW_2",
    "TEST_TASK",
    "OFFER",
    "REJECTED",
    "NO_RESPONSE",
    "WITHDREW",
]
EmploymentType = Literal["FULL_TIME", "PART_TIME", "CONTRACT"]
WorkMode = Literal["REMOTE", "HYBRID", "ON_SITE"]
AppliedVia = Literal[
    "company_site", "linkedin", "indeed", "stepstone", "email", "referral", "other"
]


class SalaryRange(BaseModel):
    currency: str | None = None
    min: int | None = None
    max: int | None = None


class ReminderItem(BaseModel):
    id: str
    at: datetime
    text: str | None = None


# ── Create ─────────────────────────────────────────────────────────────────────


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Job — required
    company_name: str
    role_title: str

    # Job — optional
    location_text: str | None = None
    vacancy_url: str | None = None
    source: str | None = None
    employment_type: EmploymentType | None = None
    work_mode: WorkMode | None = None
    salary: SalaryRange | None = None
    posted_at: datetime | None = None

    # Process
    status: ProcessStatus = "SAVED"
    sub_status: str | None = None
    applied_at: datetime | None = None
    applied_via: AppliedVia | None = None
    next_action_at: datetime | None = None
    next_action_text: str | None = None
    contact_attempts: int = 0
    last_contact_at: datetime | None = None
    follow_up_level: int = 0
    reminders: list[ReminderItem] | None = None

    # Notes
    current_note: str | None = None
    tags: list[str] | None = None

    # Vacancy
    vacancy_description: str | None = None

    # Linkage
    loop_id: str | None = None
    has_loop: bool = False
    cv_version_id: str | None = None
    profile_version_id: str | None = None


# ── Patch ──────────────────────────────────────────────────────────────────────


class ApplicationPatch(BaseModel):
    """All mutable fields. Derived fields (stage, needs_follow_up, …) are
    excluded — they are recomputed by the service on every update."""

    model_config = ConfigDict(extra="forbid")

    # Job
    company_name: str | None = None
    role_title: str | None = None
    location_text: str | None = None
    vacancy_url: str | None = None
    source: str | None = None
    employment_type: EmploymentType | None = None
    work_mode: WorkMode | None = None
    salary: SalaryRange | None = None
    posted_at: datetime | None = None

    # Process
    status: ProcessStatus | None = None
    sub_status: str | None = None
    applied_at: datetime | None = None
    applied_via: AppliedVia | None = None
    next_action_at: datetime | None = None
    next_action_text: str | None = None
    contact_attempts: int | None = None
    last_contact_at: datetime | None = None
    last_follow_up_at: datetime | None = None
    follow_up_level: int | None = None
    reapply_reason: str | None = None
    reminders: list[ReminderItem] | None = None

    # Notes
    current_note: str | None = None
    tags: list[str] | None = None

    # Vacancy
    vacancy_description: str | None = None

    # Linkage
    loop_id: str | None = None
    has_loop: bool | None = None
    cv_version_id: str | None = None
    profile_version_id: str | None = None

    # Archival (convenience — avoids a separate DELETE call)
    archived: bool | None = None


# ── Read ───────────────────────────────────────────────────────────────────────


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    archived: bool

    # Job
    company_name: str
    role_title: str
    location_text: str | None
    vacancy_url: str | None
    source: str | None
    employment_type: str | None
    work_mode: str | None
    salary: Any  # JSONB dict or None
    posted_at: datetime | None

    # Process
    status: str
    stage: str | None
    sub_status: str | None
    last_status_change_at: datetime
    applied_at: datetime | None
    applied_via: str | None
    next_action_at: datetime | None
    next_action_text: str | None
    contact_attempts: int
    last_contact_at: datetime | None
    last_follow_up_at: datetime | None
    follow_up_level: int
    needs_follow_up: bool
    follow_up_due_at: datetime | None
    needs_reapply_suggestion: bool
    reapply_eligible_at: datetime | None
    reapply_reason: str | None
    reminders: Any  # JSONB list or None

    # Notes
    current_note: str | None
    tags: Any  # JSONB list or None

    # Vacancy
    vacancy_description: str | None
    role_fingerprint: str | None

    # Linkage
    loop_id: str | None
    has_loop: bool
    cv_version_id: str | None
    profile_version_id: str | None

    # Timestamps
    created_at: datetime
    updated_at: datetime
