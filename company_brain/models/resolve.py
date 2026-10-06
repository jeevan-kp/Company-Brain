from typing import List, Optional
from pydantic import BaseModel
from .entity import EntityBase

class EntityAlias(BaseModel):
    alias_id: str
    entity_id: str
    alias_name: str
    source_system: Optional[str] = None
    project_id: Optional[str] = None

def resolve_entity(query: str, project_id: Optional[str] = None) -> List[EntityBase]:
    """
    Entity resolution logic:
    1. Exact source identifier
    2. Exact project + normalized name
    3. Alias match
    4. Fuzzy name match within same project (threshold >= 0.85)
    5. LLM-assisted inference (only if <= 3 Fall) with confidence > 0.85
    6. Below 0.85 = ask to disambiguate
    """
    # TODO: Implement DB and logic for resolution
    return []
