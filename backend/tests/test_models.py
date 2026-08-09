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
