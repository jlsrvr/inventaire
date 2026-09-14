import uuid
import datetime
from pydantic import BaseModel, NonNegativeInt


class ItemChange(BaseModel):
    """A single item as pushed by a client (no server-assigned fields)."""

    id: uuid.UUID
    name: str
    unit: str | None = None
    category: str = "other"
    quantity: NonNegativeInt  # 0 is valid — a zeroed item is the shopping list
    updated_at: datetime.datetime
    updated_by: str


class Item(ItemChange):
    """An item as stored and returned by the server, carrying its seq."""

    seq: int


class SyncRequest(BaseModel):
    since: int = 0
    changes: list[ItemChange] = []


class SyncResponse(BaseModel):
    cursor: int
    changes: list[Item]
    rejected: list[uuid.UUID]


class AuthRequest(BaseModel):
    passphrase: str


class AuthResponse(BaseModel):
    token: str
