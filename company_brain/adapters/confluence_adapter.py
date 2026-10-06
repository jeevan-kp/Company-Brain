from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.atlassian_client import AtlassianClient
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConfluenceAdapter(BaseAdapter):
    source_system = "confluence"

    def __init__(self, client: Optional[AtlassianClient] = None):
        self.client = client or AtlassianClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch Confluence pages using Confluence REST API v2."""
        resp = await self.client.get_confluence_pages(space_key="ATLAS")
        return resp.get("results", [])

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize Confluence REST API v2 page into NormalizedRecord."""
        page_id = raw_record.get("id", "")
        title = raw_record.get("title", "Confluence Page")
        body_storage = raw_record.get("body", {}).get("storage", {}).get("value", "")
        # Clean HTML tags
        content = body_storage.replace("<p>", "").replace("</p>", "").replace("<strong>", "").replace("</strong>", "")
        
        is_adr = "ADR" in title or "Decision" in title
        record_type = "ADR" if is_adr else "Documentation"

        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=page_id,
            source_url=f"https://company-brain.atlassian.net/wiki{raw_record.get('_links', {}).get('webui', f'/pages/{page_id}')}",
            record_type=record_type,
            project_id="ATLAS",
            title=title,
            content=content,
            status="Approved" if is_adr else "Current",
            priority="High" if is_adr else "Medium",
            owner="Architecture Board",
            assignee="",
            labels=["confluence", "adr" if is_adr else "docs"],
            project_key="ATLAS",
            components=[],
            created=datetime.utcnow(),
            updated=datetime.utcnow(),
            classification="Internal",
            allowed_roles=["project_manager", "developer", "architect", "support"],
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract Decision/Document entities, RECORDED_IN relationships, and architectural evidence."""
        is_adr = normalized.record_type == "ADR"
        
        entities = [{
            "entity_id": f"{'DECISION' if is_adr else 'DOCUMENT'}:{normalized.source_record_id}",
            "entity_type": "DECISION" if is_adr else "DOCUMENT",
            "name": normalized.title,
            "project_id": normalized.project_id,
            "status": normalized.status,
            "metadata": {
                "url": normalized.source_url,
                "record_type": normalized.record_type
            }
        }]

        relationships = [
            {
                "source_entity_id": f"{'DECISION' if is_adr else 'DOCUMENT'}:{normalized.source_record_id}",
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "RECORDED_IN",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": f"{'DECISION' if is_adr else 'DOCUMENT'}:{normalized.source_record_id}",
            "source_item_id": f"confluence:{normalized.source_record_id}",
            "statements": f"Confluence {normalized.record_type} '{normalized.title}' dictates: {normalized.content}",
            "authority": "architectural",
            "confidence": 1.0,
            "allowed_roles": normalized.allowed_roles
        }]

        return SemanticExtraction(
            entities=entities,
            relationships=relationships,
            evidence=evidence,
            aliases=[normalized.title]
        )

    async def ingest(self, project_config: Dict[str, Any]) -> IngestResult:
        records = await self.fetch_changes()
        for raw in records:
            norm = self.normalize(raw)
            self.extract_semantics(norm)
        return IngestResult(fetched=len(records), new=len(records), updated=0, unchanged=0)
