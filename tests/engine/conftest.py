import pytest
from engine.models import Proposal, Region, Weights


@pytest.fixture
def sample_proposals():
    return [
        Proposal(
            id="P001", title="A", partner="Org1", sector="education",
            region="Odisha", budget=1000000, beneficiaries=1000,
            outcome_depth=0.8, expected_outcome="x",
            partner_track_record=0.9, budget_realism=0.9, must_fund=False,
        ),
        Proposal(
            id="P002", title="B", partner="Org2", sector="healthcare",
            region="Bihar", budget=2000000, beneficiaries=500,
            outcome_depth=0.5, expected_outcome="y",
            partner_track_record=0.6, budget_realism=0.7, must_fund=False,
        ),
        Proposal(
            id="P003", title="C", partner="Org3", sector="environment",
            region="Odisha", budget=500000, beneficiaries=200,
            outcome_depth=0.9, expected_outcome="z",
            partner_track_record=0.95, budget_realism=0.85, must_fund=True,
        ),
    ]


@pytest.fixture
def sample_regions():
    return {
        "Odisha": Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000),
        "Bihar": Region(name="Bihar", saturation=0.15, need_index=0.9, population=124000000),
    }


@pytest.fixture
def sample_focus_areas():
    return {"education": 1.0, "healthcare": 0.8, "environment": 0.6, "community": 0.5}


@pytest.fixture
def sample_weights():
    return Weights(impact=0.3, efficiency=0.25, equity=0.2, alignment=0.15, feasibility=0.1)
