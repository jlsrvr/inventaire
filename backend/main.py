import hmac
import threading
import time
from collections import deque
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import config
import db
import timestamps
from models import (
    AuthRequest,
    AuthResponse,
    Item,
    SyncRequest,
    SyncResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.require_secrets()
    db.init_db()
    yield


# One schema per model (no `-Input`/`-Output` split from the updated_at
# serializer), so the generated client type names stay stable.
app = FastAPI(lifespan=lifespan, separate_input_output_schemas=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_origin_regex=config.ALLOWED_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    # FastAPI's default 422 echoes the offending input back, which itself
    # crashes when that input is inf/NaN (not representable in JSON). Clients
    # only need to know where and why, not their own payload repeated.
    detail = [{k: e[k] for k in ("type", "loc", "msg") if k in e} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})


security = HTTPBearer(auto_error=True)


def _matches(given: str, expected: str | None) -> bool:
    # Constant-time, so response timing doesn't leak how much of a guess was right.
    return expected is not None and hmac.compare_digest(given.encode(), expected.encode())


def require_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> None:
    if not _matches(creds.credentials, config.TOKEN):
        raise HTTPException(status_code=401, detail="invalid token")


# --- /auth brute-force guard -------------------------------------------------
# Global, not per IP: behind the reverse proxy every request comes from
# localhost, and the household enrols a handful of times a year. While someone
# is guessing, legitimate enrolment waits out the window too — an acceptable
# trade for a passphrase-only gate.
AUTH_MAX_FAILURES = 10
AUTH_WINDOW_SECONDS = 15 * 60
_auth_failures: deque[float] = deque()
_auth_lock = threading.Lock()


def reset_auth_failures() -> None:
    with _auth_lock:
        _auth_failures.clear()


def _auth_locked_out(now: float) -> bool:
    while _auth_failures and now - _auth_failures[0] > AUTH_WINDOW_SECONDS:
        _auth_failures.popleft()
    return len(_auth_failures) >= AUTH_MAX_FAILURES


UNAUTHORISED = {401: {"description": "Missing or invalid token"}}


@app.get("/health")
async def get_health():
    return {"status": "ok"}


@app.post(
    "/auth",
    response_model=AuthResponse,
    responses={
        401: {"description": "Wrong passphrase"},
        429: {"description": "Too many failed attempts, try again later"},
    },
)
def auth(req: AuthRequest):
    now = time.monotonic()
    with _auth_lock:
        if _auth_locked_out(now):
            raise HTTPException(status_code=429, detail="too many attempts")
        if not _matches(req.passphrase, config.PASSPHRASE):
            _auth_failures.append(now)
            raise HTTPException(status_code=401, detail="wrong passphrase")
    return AuthResponse(token=config.TOKEN)


@app.post(
    "/sync",
    response_model=SyncResponse,
    responses=UNAUTHORISED,
    dependencies=[Depends(require_token)],
)
def sync(req: SyncRequest):
    conn = db.connect()
    try:
        # IMMEDIATE takes the write lock now, before MAX(seq) is read: two
        # concurrent syncs serialise instead of both computing the same next seq.
        conn.execute("BEGIN IMMEDIATE")
        max_seq = conn.execute("SELECT COALESCE(MAX(seq), 0) FROM items").fetchone()[0]

        # A cursor ahead of the server means the server lost history (e.g. a
        # restore from backup). Resend everything rather than silently skip.
        since = req.since if req.since <= max_seq else 0

        next_seq = max_seq
        rejected = []

        for change in req.changes:
            updated_at = timestamps.clamp_to_now(change.updated_at)
            row = conn.execute(
                "SELECT updated_at FROM items WHERE id = ?", (str(change.id),)
            ).fetchone()
            if row is not None:
                # Last-write-wins: an equal-or-older write loses.
                if timestamps.parse(row["updated_at"]) >= updated_at:
                    rejected.append(change.id)
                    continue

            next_seq += 1
            conn.execute(
                """
                INSERT INTO items
                    (id, name, category, quantity, unit, updated_at, updated_by, seq)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name       = excluded.name,
                    category   = excluded.category,
                    quantity   = excluded.quantity,
                    unit       = excluded.unit,
                    updated_at = excluded.updated_at,
                    updated_by = excluded.updated_by,
                    seq        = excluded.seq
                """,
                (
                    str(change.id),
                    change.name,
                    change.category,
                    change.quantity,
                    change.unit,
                    timestamps.format(updated_at),
                    change.updated_by,
                    next_seq,
                ),
            )

        # Only now select what the client hasn't seen — including its own writes,
        # which come back with their canonical server seq. Rejected rows are
        # always returned too: the client may already be past their seq, and it
        # needs the winning version to replace its losing local edit.
        rejected_ids = list(dict.fromkeys(str(r) for r in rejected))
        placeholders = ",".join("?" * len(rejected_ids))
        id_clause = f" OR id IN ({placeholders})" if rejected_ids else ""
        rows = conn.execute(
            f"SELECT * FROM items WHERE seq > ?{id_clause} ORDER BY seq",
            (since, *rejected_ids),
        ).fetchall()
        conn.commit()
    finally:
        conn.close()

    changes = [Item(**dict(r)) for r in rows]
    return SyncResponse(cursor=next_seq, changes=changes, rejected=rejected)
