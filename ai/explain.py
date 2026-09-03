import json
from engine.models import Proposal, Region
from ai.groq_client import call_groq
from ai.prompts import PROMPTS


def build_facts(
    project: Proposal,
    region: Region,
    is_funded: bool,
    scores: dict,
    budget: float,
    spent: float,
    focus_areas: dict,
    rescue: dict | None = None,
) -> dict:
    all_scores = sorted(scores.values(), reverse=True)
    rank = all_scores.index(scores[project.id])
    percentile = round(100 * (1 - rank / len(all_scores)))
    facts = {
        "status": "funded" if is_funded else "rejected",
        "efficiency_percentile": percentile,
        "region": project.region,
        "underserved": region.need_index > 0.5 and region.saturation < 0.5,
        "sector": project.sector,
        "aligned": focus_areas.get(project.sector, 0) >= 0.5,
        "budget_gap": None,
        "rescue": None,
    }
    if not is_funded:
        remaining = budget - spent
        gap = project.budget - remaining
        facts["budget_gap"] = round(gap) if gap > 0 else None
        facts["rescue"] = rescue
    return facts


def explain_decision(facts: dict) -> str:
    system = PROMPTS["explain_system"]
    user = PROMPTS["explain_user"].format(facts=json.dumps(facts))
    return call_groq(system, user, model="llama3-70b-8192", json_mode=False)
