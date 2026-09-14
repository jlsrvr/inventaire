import sqlite3

import config


def connect() -> sqlite3.Connection:
    # Read config.DB_PATH at call time so tests can point it at a temp file.
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with connect() as conn:
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
        conn.commit()
