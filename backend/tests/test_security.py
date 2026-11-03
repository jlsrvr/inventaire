"""Deployment safety: secrets must be set explicitly, /auth must resist guessing."""

import pytest
from fastapi.testclient import TestClient

import config
import main


def test_startup_refuses_missing_secrets(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.db"))
    monkeypatch.setattr(config, "PASSPHRASE", None)
    monkeypatch.setattr(config, "TOKEN", None)
    with pytest.raises(RuntimeError, match="INVENTAIRE_PASSPHRASE"):
        with TestClient(main.app):
            pass


def test_dev_defaults_only_apply_in_dev_mode():
    assert config.load({}) == (None, None)
    assert config.load({"INVENTAIRE_DEV": "1"}) == ("chalet", "dev-token")
    assert config.load(
        {"INVENTAIRE_PASSPHRASE": "p", "INVENTAIRE_TOKEN": "t"}
    ) == ("p", "t")


def test_auth_is_rate_limited_after_repeated_failures(client):
    for _ in range(main.AUTH_MAX_FAILURES):
        assert client.post("/auth", json={"passphrase": "nope"}).status_code == 401
    # Even the right passphrase is refused until the window passes.
    resp = client.post("/auth", json={"passphrase": config.PASSPHRASE})
    assert resp.status_code == 429


def test_successful_auth_is_not_counted_as_failure(client):
    for _ in range(main.AUTH_MAX_FAILURES + 2):
        assert client.post("/auth", json={"passphrase": config.PASSPHRASE}).status_code == 200
