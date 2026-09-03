from unittest.mock import patch
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

WEIGHTS = {"impact": 0.3, "efficiency": 0.25, "equity": 0.2, "alignment": 0.15, "feasibility": 0.1}


def test_get_proposals_returns_45():
    resp = client.get("/proposals")
    assert resp.status_code == 200
    assert len(resp.json()) == 45


def test_allocate_returns_valid_shape_and_respects_budget():
    resp = client.post("/allocate", json={"weights": WEIGHTS, "budget": 10000000, "constraints": {}})
    assert resp.status_code == 200
    data = resp.json()
    assert data["totals"]["spent"] <= 10000000
    assert set(data.keys()) >= {
        "funded", "unfunded", "totals", "coverage", "concentration", "per_project_score", "sector_split",
    }


def test_allocate_is_deterministic():
    body = {"weights": WEIGHTS, "budget": 10000000, "constraints": {}}
    r1 = client.post("/allocate", json=body).json()
    r2 = client.post("/allocate", json=body).json()
    assert r1["funded"] == r2["funded"]


def test_explain_endpoint_mocked_groq():
    alloc = client.post("/allocate", json={"weights": WEIGHTS, "budget": 10000000, "constraints": {}}).json()
    project_id = alloc["funded"][0]
    with patch("api.main.explain_decision", return_value="Funded — good fit."):
        resp = client.post("/explain", json={
            "project_id": project_id,
            "weights": WEIGHTS,
            "budget": 10000000,
            "allocation_state": {"funded": alloc["funded"], "spent": alloc["totals"]["spent"]},
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "funded"
        assert resp.json()["reason"] == "Funded — good fit."


def test_query_endpoint_mocked_groq():
    fake_parsed = {
        "weights": {"impact": 0.3, "efficiency": 0.5, "equity": 0.1, "alignment": 0.05, "feasibility": 0.05},
        "constraints": {"region": None, "budget_cap": 5000000, "min_beneficiaries": None, "sector": None},
    }
    with patch("api.main.parse_nl_query", return_value=fake_parsed):
        resp = client.post("/query", json={"text": "cheapest way to reach 100k"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["parsed_constraints"]["budget_cap"] == 5000000
        assert "allocation" in data


def test_intake_endpoint_mocked_groq():
    with patch("api.main.extract_proposal", return_value={
        "id": "EX001", "title": "x", "sector": "education", "confidence": 0.9,
    }), patch("api.main.check_redflags", return_value=[]):
        resp = client.post("/intake", data={"raw_text": "some proposal text"})
        assert resp.status_code == 200
        assert resp.json()["extracted"][0]["id"] == "EX001"


def test_summary_endpoint_mocked_groq():
    with patch("api.main.generate_summary", return_value="A great portfolio."):
        resp = client.post("/summary", json={
            "totals": {"count": 5, "spent": 1000000, "beneficiaries": 5000, "states": 3},
            "sector_split": {"education": 2, "healthcare": 1, "environment": 1, "community": 1},
            "concentration": 0.3,
        })
        assert resp.status_code == 200
        assert resp.json()["summary"] == "A great portfolio."
