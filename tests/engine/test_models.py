import pytest
from pydantic import ValidationError
from engine.models import Proposal, Region, Weights, Constraints


def test_proposal_valid():
    p = Proposal(
        id="P001", title="Test", partner="Org", sector="education",
        region="Odisha", budget=1000000, beneficiaries=500,
        outcome_depth=0.7, expected_outcome="Better schools",
        timeline_months=12, partner_track_record=0.8, budget_realism=0.9,
    )
    assert p.must_fund is False
    assert p.sector == "education"


def test_proposal_invalid_sector_rejected():
    with pytest.raises(ValidationError):
        Proposal(
            id="P002", title="Test", partner="Org", sector="agriculture",
            region="Odisha", budget=1000000, beneficiaries=500,
            outcome_depth=0.7, expected_outcome="x",
            partner_track_record=0.8, budget_realism=0.9,
        )


def test_region_weights_constraints():
    r = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    w = Weights(impact=0.3, efficiency=0.25, equity=0.2, alignment=0.15, feasibility=0.1)
    c = Constraints()
    assert r.name == "Odisha"
    assert w.impact == 0.3
    assert c.region is None
