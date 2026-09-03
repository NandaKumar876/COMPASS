from unittest.mock import patch
from engine.models import Proposal, Region
from ai.explain import build_facts, explain_decision


def _proposal():
    return Proposal(
        id="P017", title="Solar classrooms", partner="Gram Vikas", sector="education",
        region="Odisha", budget=2400000, beneficiaries=3200, outcome_depth=0.7,
        expected_outcome="x", partner_track_record=0.8, budget_realism=0.9,
    )


def test_build_facts_funded():
    p = _proposal()
    region = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    scores = {"P017": 0.9, "P002": 0.5, "P003": 0.3}
    facts = build_facts(
        p, region, is_funded=True, scores=scores, budget=5000000, spent=2400000,
        focus_areas={"education": 1.0},
    )
    assert facts["status"] == "funded"
    assert facts["efficiency_percentile"] == 100
    assert facts["underserved"] is True
    assert facts["aligned"] is True
    assert facts["budget_gap"] is None


def test_build_facts_rejected_computes_budget_gap():
    p = _proposal()
    region = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    scores = {"P017": 0.3, "P002": 0.9}
    facts = build_facts(
        p, region, is_funded=False, scores=scores, budget=3000000, spent=2900000,
        focus_areas={"education": 1.0},
        rescue={"drop": ["P014"], "or_add_budget": 2300000},
    )
    assert facts["status"] == "rejected"
    assert facts["budget_gap"] == 2400000 - (3000000 - 2900000)
    assert facts["rescue"]["drop"] == ["P014"]


def test_explain_decision_calls_groq_plain_text():
    with patch("ai.explain.call_groq", return_value="Funded — top decile.") as mock_call:
        result = explain_decision({"status": "funded"})
        mock_call.assert_called_once()
        assert result == "Funded — top decile."
