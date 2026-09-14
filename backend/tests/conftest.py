import pytest
from fastapi.testclient import TestClient

import config
from main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Each test gets a fresh SQLite file; the `with` block runs the lifespan
    # startup so init_db() creates the schema.
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "test.db"))
    with TestClient(app) as c:
        yield c


@pytest.fixture
def token(client):
    resp = client.post("/auth", json={"passphrase": config.PASSPHRASE})
    return resp.json()["token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
