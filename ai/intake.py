from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS

REQUIRED_FIELDS = [
    "title", "partner", "sector", "region", "budget", "beneficiaries",
    "outcome_depth", "expected_outcome", "timeline_months",
    "partner_track_record", "budget_realism",
]


def extract_proposal(raw_text: str, proposal_id: str) -> dict:
    result = call_groq(PROMPTS["intake_system"], raw_text, model="openai/gpt-oss-120b")
    data = safe_json_parse(result)
    data["id"] = proposal_id
    data.setdefault("must_fund", False)
    data["confidence"] = compute_confidence(data)
    return data


def compute_confidence(data: dict) -> float:
    filled = sum(1 for field in REQUIRED_FIELDS if data.get(field) is not None)
    return round(filled / len(REQUIRED_FIELDS), 2)
