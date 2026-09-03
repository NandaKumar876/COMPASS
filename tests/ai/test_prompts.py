from ai.prompts import PROMPTS

REQUIRED_KEYS = [
    "intake_system", "explain_system", "explain_user",
    "nl_query_system", "redflags_system", "summary_system",
]


def test_all_required_prompts_present_and_nonempty():
    for key in REQUIRED_KEYS:
        assert key in PROMPTS
        assert isinstance(PROMPTS[key], str)
        assert len(PROMPTS[key].strip()) > 0


def test_explain_user_has_facts_placeholder():
    assert "{facts}" in PROMPTS["explain_user"]
