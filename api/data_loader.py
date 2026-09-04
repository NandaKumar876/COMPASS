import itertools
import json
from functools import lru_cache
from pathlib import Path
from engine.models import Proposal, Region

DATA_DIR = Path(__file__).parent.parent / "data"

# Proposals added at runtime via /intake. In-memory only (resets on restart),
# but keeps All Proposals / Command Centre in sync with what Intake extracts
# for the lifetime of a demo/session.
_added_proposals: list[Proposal] = []


@lru_cache
def _load_base_proposals() -> list[Proposal]:
    raw = json.loads((DATA_DIR / "proposals.json").read_text())
    return [Proposal(**p) for p in raw]


def load_proposals() -> list[Proposal]:
    return _load_base_proposals() + _added_proposals


def add_proposal(proposal: Proposal) -> None:
    _added_proposals.append(proposal)


# Session-wide counter for Intake-extracted IDs, so re-running Intake (real
# upload or demo button) never collides with an earlier batch's EX001, EX002...
_extracted_id_counter = itertools.count(1)


def next_extracted_id() -> str:
    return f"EX{next(_extracted_id_counter):03d}"


@lru_cache
def load_regions() -> dict[str, Region]:
    raw = json.loads((DATA_DIR / "regions.json").read_text())
    return {r["name"]: Region(**r) for r in raw}


@lru_cache
def load_objectives() -> dict:
    return json.loads((DATA_DIR / "objectives.json").read_text())
