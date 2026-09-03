import json
from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS


def check_redflags(proposal: dict) -> list[dict]:
    result = call_groq(PROMPTS["redflags_system"], f"Proposal: {json.dumps(proposal)}", model="llama3-8b-8192")
    return safe_json_parse(result)
