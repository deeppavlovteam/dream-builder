# generated by datamodel-codegen:
#   filename:  flow.json
#   timestamp: 2021-10-03T17:23:33+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel


class Datum(BaseModel):
    selectedIntent: str


class Datum1(BaseModel):
    respStr: str


class Datum2(BaseModel):
    endpoint: str
    method: Optional[str] = None
    payload: Optional[str] = None


class ElItem1(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class Xyposition(BaseModel):
    x: float
    y: float


class Position(Enum):
    left = 'left'
    top = 'top'
    right = 'right'
    bottom = 'bottom'


class ElItem(BaseModel):
    id: str
    position: Xyposition
    targetPosition: Optional[Position] = None
    sourcePosition: Optional[Position] = None
    data: Optional[Union[Datum, Datum1, Datum2]] = None


class Flow(BaseModel):
    el: List[Union[ElItem, ElItem1]]