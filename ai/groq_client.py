import json
import os
from groq import Groq

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ["GROQ_API_KEY"]
        _client = Groq(api_key=api_key)
    return _client


def call_groq(
    system_prompt: str, user_message: str, model: str = "llama3-70b-8192", json_mode: bool = True
) -> str:
    client = get_client()
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.0,
        "max_tokens": 1024,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


def safe_json_parse(raw: str):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.strip()
        if clean.startswith("```json"):
            clean = clean[len("```json"):]
        elif clean.startswith("```"):
            clean = clean[len("```"):]
        if clean.endswith("```"):
            clean = clean[:-3]
        return json.loads(clean.strip())
