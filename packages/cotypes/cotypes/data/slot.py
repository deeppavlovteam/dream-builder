# generated by datamodel-codegen:
#   filename:  slot.json
#   timestamp: 2021-10-03T17:23:33+00:00

from __future__ import annotations

from typing import List

from pydantic import BaseModel


class Slot(BaseModel):
    name: str
    examples: List[str]
