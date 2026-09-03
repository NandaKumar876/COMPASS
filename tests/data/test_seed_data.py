import json
from pathlib import Path
from engine.models import Proposal, Region

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def test_proposals_json_valid_and_45_entries():
    proposals = json.loads((DATA_DIR / "proposals.json").read_text())
    assert len(proposals) == 45
    parsed = [Proposal(**p) for p in proposals]
    ids = [p.id for p in parsed]
    assert len(ids) == len(set(ids))


def test_regions_json_valid():
    regions = json.loads((DATA_DIR / "regions.json").read_text())
    parsed = {r["name"]: Region(**r) for r in regions}
    assert len(parsed) >= 10


def test_every_proposal_region_exists_in_regions():
    proposals = json.loads((DATA_DIR / "proposals.json").read_text())
    regions = json.loads((DATA_DIR / "regions.json").read_text())
    region_names = {r["name"] for r in regions}
    for p in proposals:
        assert p["region"] in region_names


def test_objectives_json_has_all_sectors():
    objectives = json.loads((DATA_DIR / "objectives.json").read_text())
    for sector in ("education", "healthcare", "environment", "community"):
        assert sector in objectives["focus_areas"]
    assert sum(objectives["default_weights"].values()) == 1.0
