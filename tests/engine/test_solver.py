import pytest
from engine.solver import allocate_greedy, compute_totals


def test_must_fund_always_included(sample_proposals):
    scores = {"P001": 0.5, "P002": 0.9, "P003": 0.3}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=500000)
    assert "P003" in {p.id for p in funded}


def test_budget_respected(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.8, "P003": 0.5}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=1500000)
    assert spent <= 1500000


def test_determinism(sample_proposals):
    scores = {"P001": 0.7, "P002": 0.7, "P003": 0.7}
    funded1, spent1 = allocate_greedy(sample_proposals, scores, budget=3500000)
    funded2, spent2 = allocate_greedy(sample_proposals, scores, budget=3500000)
    assert [p.id for p in funded1] == [p.id for p in funded2]
    assert spent1 == spent2


def test_higher_ratio_funded_first_when_budget_tight(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.4, "P003": 0.1}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=1500000)
    funded_ids = {p.id for p in funded}
    assert "P001" in funded_ids
    assert "P002" not in funded_ids


def test_compute_totals_shape(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.4, "P003": 0.1}
    funded = [sample_proposals[0], sample_proposals[2]]
    unfunded = [sample_proposals[1]]
    result = compute_totals(funded, unfunded, spent=1500000, scores=scores)
    assert result["funded"] == ["P001", "P003"]
    assert result["unfunded"] == ["P002"]
    assert result["totals"]["count"] == 2
    assert result["totals"]["spent"] == 1500000
    assert result["totals"]["beneficiaries"] == 1000 + 200
    assert result["coverage"] == {"Odisha": 2}
    assert result["concentration"] == pytest.approx(1.0)
    assert result["sector_split"]["education"] == 1
    assert result["sector_split"]["environment"] == 1
