from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

RangeParam = Literal["7d", "30d", "90d", "all"]


class KpiResponse(BaseModel):
    range: str
    total_applications: int
    active_applications: int
    archived_applications: int
    status_counts: dict[str, int]
    follow_ups_due: int
    applied_count: int
    interview_count: int
    offer_count: int
    rejected_count: int
    response_rate: float
    interview_rate: float
    offer_rate: float
