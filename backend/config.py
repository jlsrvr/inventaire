import os
from collections.abc import Mapping

# Throwaway values, only used when INVENTAIRE_DEV=1 (local dev and tests).
_DEV_PASSPHRASE = "chalet"
_DEV_TOKEN = "dev-token"


def load(env: Mapping[str, str]) -> tuple[str | None, str | None]:
    """Shared passphrase the clients enrol with, and the long-lived token it grants.

    There are deliberately no fallbacks outside dev mode: a deploy that forgets
    to set them must fail at startup, not quietly accept `chalet`.
    """
    dev = env.get("INVENTAIRE_DEV") == "1"
    passphrase = env.get("INVENTAIRE_PASSPHRASE") or (_DEV_PASSPHRASE if dev else None)
    token = env.get("INVENTAIRE_TOKEN") or (_DEV_TOKEN if dev else None)
    return passphrase, token


PASSPHRASE, TOKEN = load(os.environ)


def require_secrets() -> None:
    """Called on startup. Reads the module globals so tests can override them."""
    missing = [
        name
        for name, value in (("INVENTAIRE_PASSPHRASE", PASSPHRASE), ("INVENTAIRE_TOKEN", TOKEN))
        if not value
    ]
    if missing:
        raise RuntimeError(
            f"{' and '.join(missing)} must be set (or INVENTAIRE_DEV=1 for local dev)."
        )


# SQLite database file. Tests point this at a temp path via the env var.
DB_PATH = os.environ.get("INVENTAIRE_DB", "inventaire.db")

# Origins allowed to call the API from a browser (comma-separated). Defaults
# to the Vite dev server so `npm run dev` works against a local backend.
ALLOWED_ORIGINS = os.environ.get("INVENTAIRE_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# Optional regex for origins that change per session (e.g. an ngrok tunnel
# used to test from a phone: `.*\.ngrok-free\.dev`). Unset by default.
ALLOWED_ORIGIN_REGEX = os.environ.get("INVENTAIRE_ALLOWED_ORIGIN_REGEX")
