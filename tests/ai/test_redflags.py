import json
from unittest.mock import patch
from ai.redflags import check_redflags


def test_check_redflags_returns_list():
    fake = json.dumps([{"flag": "vague_outcome", "reason": "no metrics"}])
    with patch("ai.redflags.call_groq", return_value=fake):
        result = check_redflags({"title": "x"})
        assert result == [{"flag": "vague_outcome", "reason": "no metrics"}]


def test_check_redflags_empty_when_clean():
    with patch("ai.redflags.call_groq", return_value="[]"):
        result = check_redflags({"title": "solid proposal"})
        assert result == []
