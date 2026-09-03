from pydantic import BaseModel
from engine.models import Weights, Constraints


class AllocateRequest(BaseModel):
    weights: Weights
    budget: float
    constraints: Constraints = Constraints()


class AllocationState(BaseModel):
    funded: list[str]
    spent: float


class ExplainRequest(BaseModel):
    project_id: str
    weights: Weights
    budget: float
    allocation_state: AllocationState


class QueryRequest(BaseModel):
    text: str


class SummaryRequest(BaseModel):
    totals: dict
    sector_split: dict
    concentration: float
