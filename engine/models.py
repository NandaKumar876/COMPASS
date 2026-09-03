from typing import Literal, Optional
from pydantic import BaseModel

Sector = Literal["education", "healthcare", "environment", "community"]


class Proposal(BaseModel):
    id: str
    title: str
    partner: str
    sector: Sector
    region: str
    budget: float
    beneficiaries: int
    outcome_depth: float
    expected_outcome: str
    timeline_months: Optional[int] = None
    partner_track_record: float
    budget_realism: float
    must_fund: bool = False


class Region(BaseModel):
    name: str
    saturation: float
    need_index: float
    population: int


class Weights(BaseModel):
    impact: float
    efficiency: float
    equity: float
    alignment: float
    feasibility: float


class Constraints(BaseModel):
    region: Optional[str] = None
    sector: Optional[Sector] = None
    min_beneficiaries: Optional[int] = None
    budget_cap: Optional[float] = None
