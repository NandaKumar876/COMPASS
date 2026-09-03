import json
from unittest.mock import patch
from ai.intake import extract_proposal, compute_confidence


def test_compute_confidence_all_fields_present():
    data = {
        "title": "x", "partner": "y", "sector": "education", "region": "Odisha",
        "budget": 100, "beneficiaries": 50, "outcome_depth": 0.5,
        "expected_outcome": "z", "timeline_months": 12,
        "partner_track_record": 0.8, "budget_realism": 0.8,
    }
    assert compute_confidence(data) == 1.0


def test_compute_confidence_missing_fields():
    data = {
        "title": "x", "partner": None, "sector": "education", "region": "Odisha",
        "budget": None, "beneficiaries": 50, "outcome_depth": 0.5,
        "expected_outcome": "z", "timeline_months": None,
        "partner_track_record": 0.8, "budget_realism": 0.8,
    }
    assert compute_confidence(data) == round(8 / 11, 2)


def test_extract_proposal_calls_groq_and_assigns_id():
    fake_json = json.dumps({
        "title": "Solar micro-grids", "partner": "Gram Oorja", "sector": "environment",
        "region": "Jharkhand", "budget": 2400000, "beneficiaries": 4000,
        "outcome_depth": 0.75, "expected_outcome": "24/7 power",
        "timeline_months": 10, "partner_track_record": 0.88, "budget_realism": 0.85,
    })
    with patch("ai.intake.call_groq", return_value=fake_json) as mock_call:
        result = extract_proposal("raw proposal text", "EX001")
        mock_call.assert_called_once()
        assert result["id"] == "EX001"
        assert result["must_fund"] is False
        assert result["confidence"] == 1.0
