import pytest
from engine.scoring import compute_raw_scores, normalize, weighted_scores, score_proposals


def test_compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    assert raw["P001"]["impact"] == 1000 * 0.8
    assert raw["P001"]["efficiency"] == (1000 * 0.8) / 1000000
    assert raw["P001"]["equity"] == 0.85 * (1 - 0.2)
    assert raw["P001"]["alignment"] == 1.0
    assert raw["P001"]["feasibility"] == 0.5 * 0.9 + 0.5 * 0.9


def test_normalize_produces_0_to_1_range(sample_proposals, sample_regions, sample_focus_areas):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    normed = normalize(raw)
    for vals in normed.values():
        for v in vals.values():
            assert 0.0 <= v <= 1.0
    best_impact_id = max(raw, key=lambda k: raw[k]["impact"])
    assert normed[best_impact_id]["impact"] == 1.0


def test_weighted_scores_sums_correctly(sample_proposals, sample_regions, sample_focus_areas, sample_weights):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    normed = normalize(raw)
    scores = weighted_scores(normed, sample_weights)
    for pid, vals in normed.items():
        expected = (
            sample_weights.impact * vals["impact"]
            + sample_weights.efficiency * vals["efficiency"]
            + sample_weights.equity * vals["equity"]
            + sample_weights.alignment * vals["alignment"]
            + sample_weights.feasibility * vals["feasibility"]
        )
        assert scores[pid] == pytest.approx(expected)


def test_score_proposals_end_to_end(sample_proposals, sample_regions, sample_focus_areas, sample_weights):
    scores = score_proposals(sample_proposals, sample_regions, sample_focus_areas, sample_weights)
    assert set(scores.keys()) == {"P001", "P002", "P003"}
    for v in scores.values():
        assert 0.0 <= v <= 1.0


def test_normalize_empty_input_returns_empty_dict():
    assert normalize({}) == {}


def test_score_proposals_empty_list_returns_empty_dict(sample_regions, sample_focus_areas, sample_weights):
    scores = score_proposals([], sample_regions, sample_focus_areas, sample_weights)
    assert scores == {}
