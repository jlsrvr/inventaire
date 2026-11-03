import datetime
import uuid
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, Field, StringConstraints, field_serializer, field_validator

import timestamps

# Mirrors frontend/src/lib/categories.ts. Exposed as an enum in the OpenAPI
# schema, so the generated client type is the same union of slugs.
Category = Literal["alimentation", "boissons", "entretien", "hygiene", "outils", "other"]

# Upper bound on one /sync push: keeps a single write transaction short. The
# client sends its outbox in batches no bigger than this.
MAX_CHANGES_PER_SYNC = 500

NonBlank = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class ItemChange(BaseModel):
    """A single item as pushed by a client (no server-assigned fields)."""

    id: uuid.UUID
    name: NonBlank
    unit: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = None
    category: Category = "other"
    # 0 is valid — a zeroed item is the shopping list. Decimal quantities are
    # allowed too, e.g. 1.5 kg of flour. inf/NaN are not numbers you can stock.
    quantity: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    # Must carry a timezone: a naive value can't be compared with an aware one.
    updated_at: AwareDatetime
    updated_by: NonBlank

    @field_validator("updated_at")
    @classmethod
    def _canonical(cls, value: datetime.datetime) -> datetime.datetime:
        # Truncate to the stored precision (ms) so comparisons see what's stored.
        return timestamps.parse(timestamps.format(value))

    @field_serializer("updated_at")
    def _serialise(self, value: datetime.datetime) -> str:
        return timestamps.format(value)


class Item(ItemChange):
    """An item as stored and returned by the server, carrying its seq."""

    seq: int


class SyncRequest(BaseModel):
    since: int = Field(0, ge=0)
    changes: list[ItemChange] = Field(default_factory=list, max_length=MAX_CHANGES_PER_SYNC)


class SyncResponse(BaseModel):
    cursor: int
    changes: list[Item]
    rejected: list[uuid.UUID]


class AuthRequest(BaseModel):
    passphrase: str


class AuthResponse(BaseModel):
    token: str
