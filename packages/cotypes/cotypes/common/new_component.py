# generated by datamodel-codegen:
#   filename:  new_component.json
#   timestamp: 2021-09-24T09:21:13+00:00

from __future__ import annotations

from pydantic import BaseModel


class NewComponent(BaseModel):
    type: str
    group: str
    label: str
    template_link: str