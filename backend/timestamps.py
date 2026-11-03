"""One canonical timestamp format for `updated_at`, everywhere.

Stored and returned as UTC with millisecond precision and a `Z` suffix —
exactly what JavaScript's `Date.prototype.toISOString()` produces, e.g.
`2026-11-03T10:00:00.123Z`. Having a single format means a stored value and an
incoming one are always comparable, and the client gets back byte-for-byte what
it would have written itself.
"""

import datetime

UTC = datetime.timezone.utc

# How far ahead of the server clock a client timestamp may be. Beyond this the
# client clock is assumed wrong and the write is stamped with server time, so a
# phone set years ahead can't win every future write to an item.
MAX_CLOCK_SKEW = datetime.timedelta(hours=1)


def to_utc(value: datetime.datetime) -> datetime.datetime:
    # Legacy rows (and the old seed script) stored naive values; treat them as UTC.
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def parse(value: str) -> datetime.datetime:
    return to_utc(datetime.datetime.fromisoformat(value))


def format(value: datetime.datetime) -> str:
    return to_utc(value).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def now() -> datetime.datetime:
    return datetime.datetime.now(UTC)


def clamp_to_now(value: datetime.datetime) -> datetime.datetime:
    current = now()
    if to_utc(value) > current + MAX_CLOCK_SKEW:
        return current
    return value
