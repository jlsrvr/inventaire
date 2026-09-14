import uuid


def make_change(**overrides):
    change = {
        "id": str(uuid.uuid4()),
        "name": "Café",
        "category": "alimentation",
        "quantity": 3,
        "unit": None,
        "updated_at": "2026-08-09T12:00:00",
        "updated_by": "John",
    }
    change.update(overrides)
    return change


# --- auth -------------------------------------------------------------------


def test_auth_accepts_correct_passphrase(client):
    resp = client.post("/auth", json={"passphrase": "chalet"})
    assert resp.status_code == 200
    assert resp.json()["token"]


def test_auth_rejects_wrong_passphrase(client):
    resp = client.post("/auth", json={"passphrase": "nope"})
    assert resp.status_code == 401


def test_sync_requires_token(client):
    resp = client.post("/sync", json={"since": 0, "changes": []})
    assert resp.status_code in (401, 403)


# --- sync -------------------------------------------------------------------


def test_sync_inserts_new_item(client, auth_headers):
    change = make_change()
    resp = client.post(
        "/sync", json={"since": 0, "changes": [change]}, headers=auth_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["rejected"] == []
    assert len(body["changes"]) == 1
    assert body["changes"][0]["id"] == change["id"]


def test_pushed_row_comes_back_with_server_seq(client, auth_headers):
    change = make_change()
    body = client.post(
        "/sync", json={"since": 0, "changes": [change]}, headers=auth_headers
    ).json()
    assert body["changes"][0]["seq"] == 1
    assert body["cursor"] == 1


def test_sync_rejects_stale_write(client, auth_headers):
    change = make_change(updated_at="2026-08-09T12:00:00")
    client.post("/sync", json={"since": 0, "changes": [change]}, headers=auth_headers)

    # Same id, older timestamp → must be rejected, stored value unchanged.
    stale = make_change(
        id=change["id"], name="Thé", updated_at="2026-08-09T11:00:00"
    )
    body = client.post(
        "/sync", json={"since": 0, "changes": [stale]}, headers=auth_headers
    ).json()
    assert body["rejected"] == [change["id"]]
    stored = [c for c in body["changes"] if c["id"] == change["id"]][0]
    assert stored["name"] == "Café"


def test_sync_accepts_newer_write(client, auth_headers):
    change = make_change(updated_at="2026-08-09T12:00:00")
    client.post("/sync", json={"since": 0, "changes": [change]}, headers=auth_headers)

    newer = make_change(
        id=change["id"], name="Thé", updated_at="2026-08-09T13:00:00"
    )
    body = client.post(
        "/sync", json={"since": 0, "changes": [newer]}, headers=auth_headers
    ).json()
    assert body["rejected"] == []
    stored = [c for c in body["changes"] if c["id"] == change["id"]][0]
    assert stored["name"] == "Thé"
    assert stored["seq"] == 2  # a new write gets the next seq


def test_seq_increases_across_items(client, auth_headers):
    a, b = make_change(), make_change()
    body = client.post(
        "/sync", json={"since": 0, "changes": [a, b]}, headers=auth_headers
    ).json()
    seqs = sorted(c["seq"] for c in body["changes"])
    assert seqs == [1, 2]


def test_since_cursor_returns_only_newer_rows(client, auth_headers):
    a = make_change()
    client.post("/sync", json={"since": 0, "changes": [a]}, headers=auth_headers)

    # A second client at since=1 pushes nothing and should see nothing new.
    body = client.post(
        "/sync", json={"since": 1, "changes": []}, headers=auth_headers
    ).json()
    assert body["changes"] == []
    assert body["cursor"] == 1


def test_zero_quantity_is_allowed(client, auth_headers):
    change = make_change(quantity=0)
    resp = client.post(
        "/sync", json={"since": 0, "changes": [change]}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["changes"][0]["quantity"] == 0


def test_decimal_quantity_round_trips(client, auth_headers):
    change = make_change(quantity=1.5, unit="kg")
    resp = client.post(
        "/sync", json={"since": 0, "changes": [change]}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["changes"][0]["quantity"] == 1.5
