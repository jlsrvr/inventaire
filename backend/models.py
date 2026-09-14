import uuid
import datetime
from pydantic import BaseModel, NonNegativeInt

class ItemChange(BaseModel):
    id : uuid.UUID
    name : str
    unit : str | None = None
    category : str = "other"
    quantity : NonNegativeInt  # 0 is valid — a zeroed item is the shopping list
    updated_at : datetime.datetime
    updated_by : str
