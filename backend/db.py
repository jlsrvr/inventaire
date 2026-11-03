import sqlite3

import config
import timestamps

# How long a write waits for another writer's lock before giving up. /sync
# takes the write lock up front (BEGIN IMMEDIATE), so a second concurrent sync
# queues here instead of failing with SQLITE_BUSY halfway through.
BUSY_TIMEOUT_SECONDS = 10


def connect() -> sqlite3.Connection:
    # Read config.DB_PATH at call time so tests can point it at a temp file.
    conn = sqlite3.connect(config.DB_PATH, timeout=BUSY_TIMEOUT_SECONDS)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = connect()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id         TEXT PRIMARY KEY,
                name       TEXT    NOT NULL,
                category   TEXT    NOT NULL DEFAULT 'other',
                quantity   REAL    NOT NULL,
                unit       TEXT,
                updated_at TEXT    NOT NULL,
                updated_by TEXT    NOT NULL,
                seq        INTEGER NOT NULL
            )
            """
        )
        # seq drives the "what has this client seen" cursor — index it.
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_seq ON items(seq)")
        _normalise_timestamps(conn)
        conn.commit()
    finally:
        conn.close()


def _normalise_timestamps(conn: sqlite3.Connection) -> None:
    """Rewrite legacy updated_at values (naive, offsets, µs) to the canonical form.

    seq is left alone: the instant is unchanged, only its spelling, and clients
    compare by parsed time, so there's nothing for them to re-fetch.
    """
    rows = conn.execute("SELECT id, updated_at FROM items").fetchall()
    for row in rows:
        canonical = timestamps.format(timestamps.parse(row["updated_at"]))
        if canonical != row["updated_at"]:
            conn.execute(
                "UPDATE items SET updated_at = ? WHERE id = ?", (canonical, row["id"])
            )
