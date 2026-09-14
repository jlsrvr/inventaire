import datetime
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import config
import db
from models import (
    AuthRequest,
    AuthResponse,
    Item,
    SyncRequest,
    SyncResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(lifespan=lifespan)

security = HTTPBearer(auto_error=True)


def require_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> None:
    if creds.credentials != config.TOKEN:
        raise HTTPException(status_code=401, detail="invalid token")


@app.get("/health")
async def get_health():
    return {"status": "ok"}


@app.post("/auth", response_model=AuthResponse)
def auth(req: AuthRequest):
    if req.passphrase != config.PASSPHRASE:
        raise HTTPException(status_code=401, detail="wrong passphrase")
    return AuthResponse(token=config.TOKEN)


@app.post("/sync", response_model=SyncResponse, dependencies=[Depends(require_token)])
def sync(req: SyncRequest):
    conn = db.connect()
    try:
        conn.execute("BEGIN")
        next_seq = conn.execute("SELECT COALESCE(MAX(seq), 0) FROM items").fetchone()[0]
        rejected = []

        for change in req.changes:
            row = conn.execute(
                "SELECT updated_at FROM items WHERE id = ?", (str(change.id),)
            ).fetchone()
            if row is not None:
                stored = datetime.datetime.fromisoformat(row["updated_at"])
                # Last-write-wins: an equal-or-older write loses.
                if stored >= change.updated_at:
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
                    change.updated_at.isoformat(),
                    change.updated_by,
                    next_seq,
                ),
            )

        # Only now select what the client hasn't seen — including its own writes,
        # which come back with their canonical server seq.
        rows = conn.execute(
            "SELECT * FROM items WHERE seq > ? ORDER BY seq", (req.since,)
        ).fetchall()
        cursor = conn.execute("SELECT COALESCE(MAX(seq), 0) FROM items").fetchone()[0]
        conn.commit()
    finally:
        conn.close()

    changes = [Item(**dict(r)) for r in rows]
    return SyncResponse(cursor=cursor, changes=changes, rejected=rejected)
