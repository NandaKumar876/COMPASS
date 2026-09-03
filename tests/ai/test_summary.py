from unittest.mock import patch
from ai.summary import generate_summary


def test_generate_summary_calls_groq_plain_text():
    with patch("ai.summary.call_groq", return_value="The portfolio funds 23 projects...") as mock_call:
        result = generate_summary({"totals": {"count": 23}})
        mock_call.assert_called_once()
        assert result.startswith("The portfolio")
