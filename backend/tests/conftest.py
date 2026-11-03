import os

# Tests use the dev passphrase/token; must be set before `config` is imported.
os.environ.setdefault("INVENTAIRE_DEV", "1")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import config  # noqa: E402
import main  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Each test gets a fresh SQLite file; the `with` block runs the lifespan
    # startup so init_db() creates the schema.
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "test.db"))
    main.reset_auth_failures()
    with TestClient(app) as c:
        yield c


@pytest.fixture
def token(client):
    resp = client.post("/auth", json={"passphrase": config.PASSPHRASE})
    return resp.json()["token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
