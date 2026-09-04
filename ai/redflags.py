import json
from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS


def check_redflags(proposal: dict) -> list[dict]:
    result = call_groq(PROMPTS["redflags_system"], f"Proposal: {json.dumps(proposal)}", model="openai/gpt-oss-20b")
    parsed = safe_json_parse(result)
    if isinstance(parsed, dict):
        # The model sometimes returns a single flag object instead of an
        # array of one when there's exactly one red flag.
        return [parsed] if parsed else []
    return parsed if isinstance(parsed, list) else []
