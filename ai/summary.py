import json
from ai.groq_client import call_groq
from ai.prompts import PROMPTS


def generate_summary(allocation_summary: dict) -> str:
    user = (
        f"Allocation summary data: {json.dumps(allocation_summary)}\n"
        "Write a concise board-ready paragraph summarizing this funded portfolio, "
        "the total reach, geographic spread, and how it aligns with organizational objectives."
    )
    return call_groq(PROMPTS["summary_system"], user, model="openai/gpt-oss-120b", json_mode=False)
