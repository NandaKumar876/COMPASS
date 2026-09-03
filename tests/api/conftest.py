import pytest


@pytest.fixture(autouse=True)
def set_fake_groq_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
