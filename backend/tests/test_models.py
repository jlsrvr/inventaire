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