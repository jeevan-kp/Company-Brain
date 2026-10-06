import hashlib
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class NormalizedRecord:
    source_system: str
    source_record_id: str
    source_url: str
    record_type: str
    project_id: str
    title: str
    content: str
    status: str
    priority: str
    owner: str
    assignee: str
    labels: List[str]
    project_key: str
    components: List[str]
    created: datetime
    updated: datetime
    classification: str
    allowed_roles: List[str]
    raw_payload: Dict[str, Any]
    content_hash: str = ""

    def __post_init__(self):
        if not self.content_hash:
            data = f"{self.title}{self.content}{self.status}{self.priority}{self.assignee}{self.labels}".encode('utf-8')
            self.content_hash = hashlib.sha256(data).hexdigest()

@dataclass
class SemanticExtraction:
    entities: List[Dict[str, Any]] = field(default_factory=list)
    relationships: List[Dict[str, Any]] = field(default_factory=list)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    aliases: List[str] = field(default_factory=list)

@dataclass
class IngestResult:
    fetched: int = 0
    new: int = 0
    updated: int = 0
    unchanged: int = 0

class BaseAdapter(ABC):
    source_system: str
    
    @abstractmethod
    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch new/changed records since watermark"""
        pass
    
    @abstractmethod
    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Convert source format to common normalized shape"""
        pass
    
    @abstractmethod
    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract entities, relationships, evidence from normalized record"""
        pass
    
    async def ingest(self, project_config: Dict[str, Any]) -> IngestResult:
        """Full pipeline: fetch -> normalize -> extract -> upload"""
        # Base implementation placeholder
        return IngestResult()
