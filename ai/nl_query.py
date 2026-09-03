from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS


def parse_nl_query(text: str) -> dict:
    result = call_groq(PROMPTS["nl_query_system"], text, model="llama3-8b-8192")
    parsed = safe_json_parse(result)
    total = sum(parsed["weights"].values())
    if total > 0:
        parsed["weights"] = {k: v / total for k, v in parsed["weights"].items()}
    return parsed
