import uuid
import pytest
from pydantic import ValidationError
from models import ItemChange


def test_category_defaults_to_other():
    item = ItemChange(
        id=uuid.uuid4(),
        name="Café",
        quantity=3,
        updated_at="2026-08-09T12:00:00",
        updated_by="John",
    )

    assert item.category == "other"


def test_rejects_negative_quantity():
    with pytest.raises(ValidationError):
        ItemChange(
            id=uuid.uuid4(),
            name="Café",
            quantity=-1,
            updated_at="2026-08-09T12:00:00",
            updated_by="John",
        )


def test_accepts_zero_quantity():
    # A zeroed item is the shopping list — it must be a valid quantity.
    item = ItemChange(
        id=uuid.uuid4(),
        name="Café",
        quantity=0,
        updated_at="2026-08-09T12:00:00",
        updated_by="John",
    )

    assert item.quantity == 0


def test_accepts_decimal_quantity():
    # e.g. 1.5 kg of flour.
    item = ItemChange(
        id=uuid.uuid4(),
        name="Farine",
        unit="kg",
        quantity=1.5,
        updated_at="2026-08-09T12:00:00",
        updated_by="John",
    )

    assert item.quantity == 1.5


def test_unit_defaults_to_none():
    item = ItemChange(
        id=uuid.uuid4(),
        name="Café",
        quantity=3,
        updated_at="2026-08-09T12:00:00",
        updated_by="John",
    )

    assert item.unit is None

def test_unit_can_be_filled():
    unit = "Bottles"
    item = ItemChange(
        id=uuid.uuid4(),
        name="Café",
        unit=unit,
        quantity=3,
        updated_at="2026-08-09T12:00:00",
        updated_by="John",
    )

    assert item.unit == unit