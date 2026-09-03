import json
import pytest
from unittest.mock import patch
from ai.nl_query import parse_nl_query


def test_parse_nl_query_normalizes_weights():
    fake = json.dumps({
        "weights": {"impact": 0.6, "efficiency": 1.0, "equity": 0.2, "alignment": 0.1, "feasibility": 0.1},
        "constraints": {"region": "Tamil Nadu", "budget_cap": 3000000, "min_beneficiaries": 100000, "sector": None},
    })
    with patch("ai.nl_query.call_groq", return_value=fake):
        result = parse_nl_query("cheapest way to reach 100k children in Tamil Nadu under 30L")
        total = sum(result["weights"].values())
        assert total == pytest.approx(1.0)
        assert result["constraints"]["region"] == "Tamil Nadu"
