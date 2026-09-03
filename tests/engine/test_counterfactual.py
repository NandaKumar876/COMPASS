from engine.counterfactual import rescue


def test_already_fits_returns_that_type(sample_proposals):
    target = sample_proposals[1]  # P002, budget 2,000,000
    scores = {"P001": 0.5, "P002": 0.5, "P003": 0.5}
    funded = [sample_proposals[0]]  # P001 only, spent 1,000,000
    result = rescue(target, funded, scores, budget=5000000, spent=1000000)
    assert result["type"] == "already_fits"


def test_swap_finds_minimal_drop_set(sample_proposals):
    target = sample_proposals[1]  # P002, budget 2,000,000
    scores = {"P001": 0.9, "P002": 0.5, "P003": 0.9}
    funded = [sample_proposals[0], sample_proposals[2]]  # P001 (1M) + P003 must_fund (0.5M), spent 1.5M
    result = rescue(target, funded, scores, budget=1500000, spent=1500000)
    assert result["type"] == "swap"
    assert "P003" not in result["drop"]
    assert result["drop"] == ["P001"]
    assert result["or_add_budget"] == 2000000
