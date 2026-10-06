from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union
from datetime import datetime

class Evidence(BaseModel):
    entity_id: Optional[str] = None
    rel_id: Optional[Union[str, int]] = None
    source_item_id: str
    statements: Union[List[str], str]
    authority: str = Field(default="operational", description="governance/architectural/operational/informal")
    confidence: float = 1.0
    allowed_roles: List[str] = Field(default_factory=list)
    observed_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class SourceItem(BaseModel):
    source_item_id: str
    source_system: str
    source_record_id: str
    source_url: Optional[str] = None
    record_type: str
    project_id: Optional[str] = None
    content: Union[Dict[str, Any], str]
    content_hash: str
    classification: Optional[str] = "Internal"
    allowed_roles: List[str] = Field(default_factory=list)
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
