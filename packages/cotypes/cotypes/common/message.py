# generated by datamodel-codegen:
#   filename:  message.json
#   timestamp: 2021-09-29T12:42:37+00:00

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class UserType(Enum):
    bot = 'bot'
    user = 'user'


class Message(BaseModel):
    user_type: UserType
    text: Optional[str] = None
    annotations: Optional[Dict[str, Any]] = None
    date_time: Optional[datetime] = None
    hypotheses: Optional[List[Dict[str, Any]]] = None
    attributes: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
