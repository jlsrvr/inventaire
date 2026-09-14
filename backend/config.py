import os

# Shared passphrase the clients enrol with, and the long-lived token it grants.
# Override both in any real deployment via the environment.
PASSPHRASE = os.environ.get("INVENTAIRE_PASSPHRASE", "chalet")
TOKEN = os.environ.get("INVENTAIRE_TOKEN", "dev-token")

# SQLite database file. Tests point this at a temp path via the env var.
DB_PATH = os.environ.get("INVENTAIRE_DB", "inventaire.db")

# Origins allowed to call the API from a browser (comma-separated). Defaults
# to the Vite dev server so `npm run dev` works against a local backend.
ALLOWED_ORIGINS = os.environ.get("INVENTAIRE_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# Optional regex for origins that change per session (e.g. an ngrok tunnel
# used to test from a phone: `.*\.ngrok-free\.dev`). Unset by default.
ALLOWED_ORIGIN_REGEX = os.environ.get("INVENTAIRE_ALLOWED_ORIGIN_REGEX")
