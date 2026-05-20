from typing import Literal

from pydantic import BaseModel, ConfigDict

PlanName = Literal["free", "basic", "premium"]


class DevAnalysisPlanPatch(BaseModel):
    plan: PlanName

    model_config = ConfigDict(extra="forbid")


class DevAnalysisPlanUpdateResponse(BaseModel):
    plan: PlanName
    message: str
