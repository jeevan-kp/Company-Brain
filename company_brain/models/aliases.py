from typing import List, Optional
from pydantic import BaseModel

class EntityAliasDB(BaseModel):
    id: str
    entity_id: str
    alias_name: str
    source_system: Optional[str] = None
    project_id: Optional[str] = None
    created_at: str

def register_alias(entity_id: str, alias_name: str, source_system: Optional[str] = None, project_id: Optional[str] = None) -> EntityAliasDB:
    """Register a new alias for an entity."""
    pass

def lookup_alias(alias_name: str, project_id: Optional[str] = None) -> Optional[str]:
    """Lookup entity_id by alias_name."""
    pass

def deduplicate_aliases(entity_ids: List[str]) -> str:
    """Collapse entities from different sources into one via alias matching."""
    pass
