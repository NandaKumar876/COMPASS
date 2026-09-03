import json
from functools import lru_cache
from pathlib import Path
from engine.models import Proposal, Region

DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache
def load_proposals() -> list[Proposal]:
    raw = json.loads((DATA_DIR / "proposals.json").read_text())
    return [Proposal(**p) for p in raw]


@lru_cache
def load_regions() -> dict[str, Region]:
    raw = json.loads((DATA_DIR / "regions.json").read_text())
    return {r["name"]: Region(**r) for r in raw}


@lru_cache
def load_objectives() -> dict:
    return json.loads((DATA_DIR / "objectives.json").read_text())
