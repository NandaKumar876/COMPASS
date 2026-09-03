from unittest.mock import MagicMock, patch
import ai.groq_client as gc


def test_get_client_reads_api_key_from_env(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    with patch("ai.groq_client.Groq") as MockGroq:
        gc.get_client()
        MockGroq.assert_called_once_with(api_key="fake-key")
    gc._client = None


def test_call_groq_uses_json_mode_by_default(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"ok": true}'
    with patch("ai.groq_client.Groq") as MockGroq:
        MockGroq.return_value.chat.completions.create.return_value = mock_response
        result = gc.call_groq("system", "user")
        call_kwargs = MockGroq.return_value.chat.completions.create.call_args.kwargs
        assert call_kwargs["response_format"] == {"type": "json_object"}
        assert call_kwargs["temperature"] == 0.0
        assert result == '{"ok": true}'
    gc._client = None


def test_call_groq_plain_text_mode(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "plain sentence"
    with patch("ai.groq_client.Groq") as MockGroq:
        MockGroq.return_value.chat.completions.create.return_value = mock_response
        result = gc.call_groq("system", "user", json_mode=False)
        call_kwargs = MockGroq.return_value.chat.completions.create.call_args.kwargs
        assert "response_format" not in call_kwargs
        assert result == "plain sentence"
    gc._client = None


def test_safe_json_parse_plain_json():
    assert gc.safe_json_parse('{"a": 1}') == {"a": 1}


def test_safe_json_parse_strips_markdown_fences():
    raw = '```json\n{"a": 1}\n```'
    assert gc.safe_json_parse(raw) == {"a": 1}
