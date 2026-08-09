import uuid
import datetime
from pydantic import BaseModel, PositiveInt

class ItemChange(BaseModel):
    id : uuid.UUID
    name : str
    unit : str = None
    category : str = "other"
    quantity : PositiveInt
    updated_at : datetime.datetime
    updated_by : str