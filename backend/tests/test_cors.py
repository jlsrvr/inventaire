from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient


def make_app(allow_origin_regex: str) -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_origin_regex=allow_origin_regex,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/ping")
    def ping():
        return {"ok": True}

    return app


def preflight(client: TestClient, origin: str):
    return client.options(
        "/ping",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )


def test_origin_regex_allows_a_matching_tunnel_origin():
    client = TestClient(make_app(r"https://.*\.ngrok-free\.dev"))
    resp = preflight(client, "https://collusively-soricine-nikolas.ngrok-free.dev")
    assert resp.status_code == 200
    assert (
        resp.headers["access-control-allow-origin"]
        == "https://collusively-soricine-nikolas.ngrok-free.dev"
    )


def test_origin_regex_rejects_a_non_matching_origin():
    client = TestClient(make_app(r"https://.*\.ngrok-free\.dev"))
    resp = preflight(client, "https://evil.example.com")
    assert resp.status_code == 400


def test_explicit_allow_list_still_works_alongside_the_regex():
    client = TestClient(make_app(r"https://.*\.ngrok-free\.dev"))
    resp = preflight(client, "http://localhost:5173")
    assert resp.status_code == 200
