"""Protocol edge cases found in review: timestamps, rejects, cursors, validation."""

import json
import uuid

import db


def make_change(**overrides):
    change = {
        "id": str(uuid.uuid4()),
        "name": "Café",
        "category": "alimentation",
        "quantity": 3,
        "unit": None,
        "updated_at": "2026-08-09T12:00:00Z",
        "updated_by": "John",
    }
    change.update(overrides)
    return change


def push(client, headers, changes, since=0):
    return client.post("/sync", json={"since": since, "changes": changes}, headers=headers)


# --- timestamps -------------------------------------------------------------


def test_updated_at_is_returned_in_js_iso_format(client, auth_headers):
    # The browser writes `new Date().toISOString()`; it must get the same
    # string back, not `.123000Z` or `+00:00`.
    change = make_change(updated_at="2026-11-03T10:00:00.123Z")
    body = push(client, auth_headers, [change]).json()
    assert body["changes"][0]["updated_at"] == "2026-11-03T10:00:00.123Z"


def test_offset_timestamps_are_normalised_to_utc(client, auth_headers):
    change = make_change(updated_at="2026-11-03T12:00:00+02:00")
    body = push(client, auth_headers, [change]).json()
    assert body["changes"][0]["updated_at"] == "2026-11-03T10:00:00.000Z"


def test_mixed_timezone_formats_compare_without_crashing(client, auth_headers):
    change = make_change(updated_at="2026-11-03T10:00:00Z")
    push(client, auth_headers, [change])

    newer = make_change(id=change["id"], name="Thé", updated_at="2026-11-03T13:00:00+02:00")
    resp = push(client, auth_headers, [newer])
    assert resp.status_code == 200
    assert resp.json()["rejected"] == []


def test_naive_timestamp_is_rejected(client, auth_headers):
    resp = push(client, auth_headers, [make_change(updated_at="2026-11-03T10:00:00")])
    assert resp.status_code == 422


def test_far_future_timestamp_is_clamped_to_server_time(client, auth_headers):
    change = make_change(updated_at="2099-01-01T00:00:00Z")
    body = push(client, auth_headers, [change]).json()
    stored = body["changes"][0]["updated_at"]
    assert stored < "2099"
    assert stored.endswith("Z")


def test_legacy_naive_rows_are_migrated_on_startup(client, auth_headers):
    conn = db.connect()
    conn.execute(
        "INSERT INTO items VALUES (?, 'Sel', 'other', 1, NULL, '2026-08-09T12:00:00', 'Seed', 1)",
        ("00000000-0000-4000-8000-000000000001",),
    )
    conn.commit()
    conn.close()

    db.init_db()
    body = push(client, auth_headers, []).json()
    assert body["changes"][0]["updated_at"] == "2026-08-09T12:00:00.000Z"


# --- rejects ----------------------------------------------------------------


def test_rejected_write_returns_the_winner_even_if_client_already_saw_it(
    client, auth_headers
):
    # B writes; A syncs and is now at cursor 1; A then pushes an older edit.
    winner = make_change(updated_at="2026-11-03T10:00:00Z")
    cursor = push(client, auth_headers, [winner]).json()["cursor"]

    stale = make_change(id=winner["id"], name="Thé", updated_at="2026-11-03T09:00:00Z")
    body = push(client, auth_headers, [stale], since=cursor).json()

    assert body["rejected"] == [winner["id"]]
    assert [c["name"] for c in body["changes"]] == ["Café"]


def test_equal_timestamp_is_rejected_as_stale(client, auth_headers):
    change = make_change()
    push(client, auth_headers, [change])
    tie = make_change(id=change["id"], name="Thé")
    body = push(client, auth_headers, [tie], since=1).json()
    assert body["rejected"] == [change["id"]]
    assert body["changes"][0]["name"] == "Café"


# --- cursor -----------------------------------------------------------------


def test_since_ahead_of_server_resends_everything(client, auth_headers):
    # e.g. the server DB was restored from an older backup.
    push(client, auth_headers, [make_change(), make_change()])
    body = push(client, auth_headers, [], since=999).json()
    assert len(body["changes"]) == 2
    assert body["cursor"] == 2


def test_negative_since_is_rejected(client, auth_headers):
    assert push(client, auth_headers, [], since=-1).status_code == 422


# --- validation -------------------------------------------------------------


def test_unknown_category_is_rejected(client, auth_headers):
    assert push(client, auth_headers, [make_change(category="??nope")]).status_code == 422


def test_blank_name_is_rejected(client, auth_headers):
    assert push(client, auth_headers, [make_change(name="   ")]).status_code == 422


def test_blank_updated_by_is_rejected(client, auth_headers):
    assert push(client, auth_headers, [make_change(updated_by="")]).status_code == 422


def test_infinite_quantity_is_rejected(client, auth_headers):
    # Python's json accepts the non-standard `Infinity` literal.
    raw = json.dumps({"since": 0, "changes": [make_change()]}).replace(
        '"quantity": 3', '"quantity": Infinity'
    )
    resp = client.post(
        "/sync",
        content=raw,
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert resp.status_code == 422


def test_oversized_batch_is_rejected(client, auth_headers):
    changes = [make_change() for _ in range(501)]
    assert push(client, auth_headers, changes).status_code == 422


# --- auth -------------------------------------------------------------------


def test_wrong_token_is_401(client):
    resp = client.post(
        "/sync",
        json={"since": 0, "changes": []},
        headers={"Authorization": "Bearer nope"},
    )
    assert resp.status_code == 401


def test_openapi_documents_401_on_sync(client):
    schema = client.get("/openapi.json").json()
    assert "401" in schema["paths"]["/sync"]["post"]["responses"]


def test_category_enum_is_in_openapi(client):
    schema = client.get("/openapi.json").json()
    category = schema["components"]["schemas"]["ItemChange"]["properties"]["category"]
    assert "other" in json.dumps(category)


# --- concurrency ------------------------------------------------------------


def test_concurrent_syncs_get_unique_seqs(client, auth_headers):
    from concurrent.futures import ThreadPoolExecutor

    def one(_):
        return push(client, auth_headers, [make_change()])

    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(one, range(16)))

    assert all(r.status_code == 200 for r in responses)
    final = push(client, auth_headers, []).json()
    seqs = sorted(c["seq"] for c in final["changes"])
    assert seqs == list(range(1, 17))
