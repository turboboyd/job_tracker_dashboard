"""Unit tests for the Firestore → PostgreSQL migration mapper.

All tests are pure: no database connection, no Firebase credentials, no network.
Datetime objects stand in for Firestore Timestamps.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.modules.applications.derived import apply_derived
from scripts.migrate_firestore_to_postgres import (
    _serialize_jsonb,
    _ts_to_dt,
    is_already_migrated,
    map_firestore_doc_to_application_dict,
    map_firestore_history_to_dict,
)

UTC = timezone.utc
USER_ID = uuid.uuid4()
APP_ID = uuid.uuid4()


# ── _ts_to_dt ─────────────────────────────────────────────────────────────────


def test_ts_to_dt_none_returns_none():
    assert _ts_to_dt(None) is None


def test_ts_to_dt_aware_datetime_returned_unchanged():
    dt = datetime(2024, 3, 1, 12, 0, 0, tzinfo=UTC)
    assert _ts_to_dt(dt) == dt


def test_ts_to_dt_naive_datetime_gets_utc():
    naive = datetime(2024, 3, 1, 12, 0, 0)
    result = _ts_to_dt(naive)
    assert result is not None
    assert result.tzinfo == UTC
    assert result.replace(tzinfo=None) == naive


def test_ts_to_dt_object_with_to_datetime_method():
    class FakeTimestamp:
        def to_datetime(self, tz):
            return datetime(2024, 6, 15, 8, 0, tzinfo=tz)

    result = _ts_to_dt(FakeTimestamp())
    assert result == datetime(2024, 6, 15, 8, 0, tzinfo=UTC)


def test_ts_to_dt_unknown_type_returns_none():
    assert _ts_to_dt("not-a-timestamp") is None
    assert _ts_to_dt(12345) is None


# ── _serialize_jsonb ──────────────────────────────────────────────────────────


def test_serialize_jsonb_datetime_to_iso():
    dt = datetime(2024, 1, 15, 10, 30, tzinfo=UTC)
    assert _serialize_jsonb(dt) == "2024-01-15T10:30:00+00:00"


def test_serialize_jsonb_naive_datetime():
    naive = datetime(2024, 1, 15, 10, 30)
    result = _serialize_jsonb(naive)
    assert result == "2024-01-15T10:30:00+00:00"


def test_serialize_jsonb_nested_list():
    dt = datetime(2024, 1, 1, tzinfo=UTC)
    result = _serialize_jsonb([{"at": dt, "id": "x"}])
    assert result == [{"at": "2024-01-01T00:00:00+00:00", "id": "x"}]


def test_serialize_jsonb_passthrough_primitives():
    assert _serialize_jsonb(42) == 42
    assert _serialize_jsonb("hello") == "hello"
    assert _serialize_jsonb(None) is None
    assert _serialize_jsonb({"a": 1}) == {"a": 1}


# ── map_firestore_doc_to_application_dict ─────────────────────────────────────


def _full_firestore_doc() -> dict:
    t1 = datetime(2024, 1, 10, 9, 0, tzinfo=UTC)
    t2 = datetime(2024, 1, 12, 14, 0, tzinfo=UTC)
    t3 = datetime(2024, 2, 1, tzinfo=UTC)
    return {
        "createdAt": t1,
        "updatedAt": t2,
        "createdBy": "firebase-uid-abc",
        "archived": False,
        "job": {
            "companyName": "Acme Corp",
            "companyId": "company-123",  # should be dropped
            "roleTitle": "Backend Engineer",
            "locationText": "Berlin, Germany",
            "vacancyUrl": "https://acme.example/jobs/42",
            "source": "linkedin",
            "employmentType": "FULL_TIME",
            "workMode": "HYBRID",
            "salary": {"currency": "EUR", "min": 70000, "max": 90000},
            "postedAt": t3,
        },
        "process": {
            "status": "APPLIED",
            "subStatus": "APPLIED",
            "lastStatusChangeAt": t2,
            "appliedAt": t2,
            "appliedVia": "linkedin",
            "nextActionAt": t3,
            "nextActionText": "Follow up",
            "contactAttempts": 2,
            "lastContactAt": t2,
            "lastFollowUpAt": t2,
            "followUpLevel": 1,
            "needsFollowUp": True,       # should be ignored; recomputed
            "followUpDueAt": t3,         # should be ignored; recomputed
            "needsReapplySuggestion": False,  # should be ignored; recomputed
            "reapplyEligibleAt": None,   # should be ignored; recomputed
            "reapplyReason": None,
            "reminders": [
                {"id": "rem-1", "at": t3, "text": "Call HR"},
            ],
        },
        "notes": {
            "currentNote": "Looks interesting",
            "tags": ["python", "backend"],
        },
        "vacancy": {
            "rawDescription": "We need a backend engineer...",
            "roleFingerprint": "fp-abc123",
        },
        "loopLinkage": {
            "loopId": "loop-xyz",
            "platform": "linkedin",      # no PG column — dropped
            "source": "loop",            # no PG column — dropped
        },
        "hasLoop": True,
        "cvLinkage": {
            "cvVersionId": "cv-v1",
            "profileVersionId": "profile-v1",
        },
        # Computed blocks — should not appear in output
        "matching": {"score": 80, "decision": "match"},
        "priority": {"score": 75},
        "integrations": {"googleCalendar": {"eventId": "evt-1"}},
        # top-level tags — should be shadowed by notes.tags
        "tags": ["should-be-ignored"],
    }


def test_map_full_doc_job_fields():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert result["company_name"] == "Acme Corp"
    assert result["role_title"] == "Backend Engineer"
    assert result["location_text"] == "Berlin, Germany"
    assert result["vacancy_url"] == "https://acme.example/jobs/42"
    assert result["source"] == "linkedin"
    assert result["employment_type"] == "FULL_TIME"
    assert result["work_mode"] == "HYBRID"
    assert result["salary"] == {"currency": "EUR", "min": 70000, "max": 90000}
    assert result["posted_at"] == datetime(2024, 2, 1, tzinfo=UTC)


def test_map_full_doc_process_fields():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert result["status"] == "APPLIED"
    assert result["sub_status"] == "APPLIED"
    assert result["applied_via"] == "linkedin"
    assert result["contact_attempts"] == 2
    assert result["follow_up_level"] == 1
    assert result["next_action_text"] == "Follow up"


def test_map_full_doc_timestamps_preserved():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert result["created_at"] == datetime(2024, 1, 10, 9, 0, tzinfo=UTC)
    assert result["updated_at"] == datetime(2024, 1, 12, 14, 0, tzinfo=UTC)
    assert result["last_status_change_at"] == datetime(2024, 1, 12, 14, 0, tzinfo=UTC)


def test_map_full_doc_notes_and_vacancy():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert result["current_note"] == "Looks interesting"
    assert result["vacancy_description"] == "We need a backend engineer..."
    assert result["role_fingerprint"] == "fp-abc123"


def test_map_full_doc_linkage():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert result["loop_id"] == "loop-xyz"
    assert result["has_loop"] is True
    assert result["cv_version_id"] == "cv-v1"
    assert result["profile_version_id"] == "profile-v1"


def test_map_full_doc_user_id_set():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)
    assert result["user_id"] == USER_ID


def test_map_computed_fields_absent_before_apply_derived():
    """Mapper must NOT set computed fields — that is apply_derived's job."""
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert "stage" not in result
    assert "needs_follow_up" not in result
    assert "follow_up_due_at" not in result
    assert "needs_reapply_suggestion" not in result
    assert "reapply_eligible_at" not in result


def test_map_dropped_fields_absent():
    """Fields that have no PG column must not appear in the output."""
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    assert "createdBy" not in result
    assert "matching" not in result
    assert "priority" not in result
    assert "integrations" not in result
    assert "companyId" not in result


def test_map_reminders_timestamps_serialized():
    result = map_firestore_doc_to_application_dict(_full_firestore_doc(), USER_ID)

    reminders = result["reminders"]
    assert isinstance(reminders, list)
    assert len(reminders) == 1
    rem = reminders[0]
    assert rem["id"] == "rem-1"
    assert rem["text"] == "Call HR"
    # datetime must be serialized to ISO string for JSONB
    assert isinstance(rem["at"], str)
    assert rem["at"].startswith("2024-02-01")


# ── Tags normalization ────────────────────────────────────────────────────────


def test_tags_notes_tags_preferred_over_top_level():
    doc = {
        "job": {"companyName": "X", "roleTitle": "Y"},
        "process": {"status": "SAVED", "lastStatusChangeAt": datetime.now(UTC),
                    "contactAttempts": 0, "followUpLevel": 0},
        "notes": {"tags": ["python", "backend"]},
        "tags": ["should-be-ignored"],
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)
    assert result["tags"] == ["python", "backend"]


def test_tags_empty_notes_tags_wins_over_nonempty_top_level():
    doc = {
        "job": {"companyName": "X", "roleTitle": "Y"},
        "process": {"status": "SAVED", "lastStatusChangeAt": datetime.now(UTC),
                    "contactAttempts": 0, "followUpLevel": 0},
        "notes": {"tags": []},
        "tags": ["should-be-ignored"],
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)
    assert result["tags"] == []


def test_tags_fallback_to_top_level_when_notes_tags_absent():
    doc = {
        "job": {"companyName": "X", "roleTitle": "Y"},
        "process": {"status": "SAVED", "lastStatusChangeAt": datetime.now(UTC),
                    "contactAttempts": 0, "followUpLevel": 0},
        "notes": {"currentNote": "hi"},  # no tags key
        "tags": ["go", "api"],
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)
    assert result["tags"] == ["go", "api"]


def test_tags_none_when_both_absent():
    doc = {
        "job": {"companyName": "X", "roleTitle": "Y"},
        "process": {"status": "SAVED", "lastStatusChangeAt": datetime.now(UTC),
                    "contactAttempts": 0, "followUpLevel": 0},
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)
    assert result["tags"] is None


# ── Minimal document (only required fields) ───────────────────────────────────


def test_map_minimal_doc_defaults():
    doc = {
        "job": {"companyName": "StartupX", "roleTitle": "SRE"},
        "process": {
            "status": "SAVED",
            "lastStatusChangeAt": datetime(2024, 5, 1, tzinfo=UTC),
            "contactAttempts": 0,
            "followUpLevel": 0,
        },
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)

    assert result["company_name"] == "StartupX"
    assert result["role_title"] == "SRE"
    assert result["status"] == "SAVED"
    assert result["archived"] is False
    assert result["has_loop"] is False
    assert result["contact_attempts"] == 0
    assert result["follow_up_level"] == 0
    assert result["location_text"] is None
    assert result["vacancy_url"] is None
    assert result["salary"] is None
    assert result["applied_at"] is None
    assert result["tags"] is None
    assert result["reminders"] is None
    assert result["loop_id"] is None
    assert result["cv_version_id"] is None


# ── apply_derived integration ─────────────────────────────────────────────────


@pytest.mark.parametrize("status,expected_stage", [
    ("SAVED", "ACTIVE"),
    ("PLANNED", "ACTIVE"),
    ("APPLIED", "ACTIVE"),
    ("VIEWED", "ACTIVE"),
    ("INTERVIEW_1", "INTERVIEW"),
    ("INTERVIEW_2", "INTERVIEW"),
    ("TEST_TASK", "INTERVIEW"),
    ("OFFER", "OFFER"),
    ("REJECTED", "REJECTED"),
    ("NO_RESPONSE", "NO_RESPONSE"),
    ("WITHDREW", "ARCHIVED"),
])
def test_apply_derived_stage_for_each_status(status, expected_stage):
    doc = {
        "job": {"companyName": "Co", "roleTitle": "Eng"},
        "process": {
            "status": status,
            "lastStatusChangeAt": datetime.now(UTC),
            "contactAttempts": 0,
            "followUpLevel": 0,
        },
    }
    result = map_firestore_doc_to_application_dict(doc, USER_ID)
    apply_derived(result)

    assert result["stage"] == expected_stage
    assert "needs_follow_up" in result
    assert "follow_up_due_at" in result
    assert "needs_reapply_suggestion" in result
    assert "reapply_eligible_at" in result


# ── map_firestore_history_to_dict ─────────────────────────────────────────────


def test_map_history_status_change():
    hist = {
        "createdAt": datetime(2024, 2, 10, tzinfo=UTC),
        "actor": "user",
        "type": "STATUS_CHANGE",
        "fromStatus": "SAVED",
        "toStatus": "APPLIED",
        "correlationId": "corr-abc",
    }
    result = map_firestore_history_to_dict(hist, APP_ID, USER_ID)

    assert result["application_id"] == APP_ID
    assert result["user_id"] == USER_ID
    assert result["actor"] == "user"
    assert result["type"] == "STATUS_CHANGE"
    assert result["from_status"] == "SAVED"
    assert result["to_status"] == "APPLIED"
    assert result["correlation_id"] == "corr-abc"
    assert result["created_at"] == datetime(2024, 2, 10, tzinfo=UTC)


def test_map_history_comment():
    hist = {
        "actor": "user",
        "type": "COMMENT",
        "comment": "Great company culture",
        "feedbackType": "SELF_NOTE",
        "sentiment": "positive",
    }
    result = map_firestore_history_to_dict(hist, APP_ID, USER_ID)

    assert result["type"] == "COMMENT"
    assert result["comment"] == "Great company culture"
    assert result["feedback_type"] == "SELF_NOTE"
    assert result["sentiment"] == "positive"


def test_map_history_field_change_jsonb():
    hist = {
        "actor": "user",
        "type": "FIELD_CHANGE",
        "fieldPath": "process.status",
        "oldValue": "SAVED",
        "newValue": "APPLIED",
    }
    result = map_firestore_history_to_dict(hist, APP_ID, USER_ID)

    assert result["field_path"] == "process.status"
    assert result["old_value"] == "SAVED"
    assert result["new_value"] == "APPLIED"


def test_map_history_minimal_defaults():
    result = map_firestore_history_to_dict({}, APP_ID, USER_ID)

    assert result["actor"] == "user"
    assert result["type"] == "SYSTEM"
    assert result["from_status"] is None
    assert result["to_status"] is None
    assert result["comment"] is None
    assert result["feedback_type"] is None
    assert result["sentiment"] is None
    assert result["rejection_reason_code"] is None
    assert result["correlation_id"] is None
    assert result["old_value"] is None
    assert result["new_value"] is None


def test_map_history_datetime_in_old_value_serialized():
    dt = datetime(2024, 1, 1, tzinfo=UTC)
    hist = {
        "actor": "system",
        "type": "FIELD_CHANGE",
        "fieldPath": "process.appliedAt",
        "oldValue": None,
        "newValue": dt,
    }
    result = map_firestore_history_to_dict(hist, APP_ID, USER_ID)
    assert isinstance(result["new_value"], str)
    assert result["new_value"].startswith("2024-01-01")


# ── is_already_migrated ───────────────────────────────────────────────────────


def test_is_already_migrated_found():
    migrated = {"doc-aaa", "doc-bbb", "doc-ccc"}
    assert is_already_migrated(migrated, "doc-bbb") is True


def test_is_already_migrated_not_found():
    migrated = {"doc-aaa", "doc-bbb"}
    assert is_already_migrated(migrated, "doc-zzz") is False


def test_is_already_migrated_empty_set():
    assert is_already_migrated(set(), "doc-anything") is False
