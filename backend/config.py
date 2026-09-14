import os

# Shared passphrase the clients enrol with, and the long-lived token it grants.
# Override both in any real deployment via the environment.
PASSPHRASE = os.environ.get("INVENTAIRE_PASSPHRASE", "chalet")
TOKEN = os.environ.get("INVENTAIRE_TOKEN", "dev-token")

# SQLite database file. Tests point this at a temp path via the env var.
DB_PATH = os.environ.get("INVENTAIRE_DB", "inventaire.db")
