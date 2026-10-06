from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.sharepoint_client import SharePointGraphClient
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SharepointAdapter(BaseAdapter):
    source_system = "sharepoint"

    def __init__(self, client: Optional[SharePointGraphClient] = None):
        self.client = client or SharePointGraphClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch files from SharePoint drive via Microsoft Graph API."""
        resp = await self.client.get_drive_items()
        return resp.get("value", [])

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize Microsoft Graph DriveItem into NormalizedRecord."""
        fields = raw_record.get("fields", {})
        doc_id = raw_record.get("id", "")
        title = fields.get("Title") or raw_record.get("name", "Document")
        project_id = fields.get("ProjectID", "ATLAS")
        doc_type = fields.get("DocumentType", "Document")
        status = fields.get("ApprovalStatus", "Draft")
        classification = fields.get("Classification", "Internal")
        allowed_roles = fields.get("AllowedRoles", ["project_manager", "architect", "developer", "support"])
        
        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=doc_id,
            source_url=raw_record.get("webUrl", ""),
            record_type=doc_type,
            project_id=project_id,
            title=title,
            content=fields.get("Summary") or fields.get("Claim") or f"SharePoint document {title}",
            status=status,
            priority="Medium",
            owner=raw_record.get("createdBy", {}).get("user", {}).get("displayName", ""),
            assignee=fields.get("Approver", ""),
            labels=[doc_type, classification],
            project_key="",
            components=[],
            created=datetime.utcnow(),
            updated=datetime.utcnow(),
            classification=classification,
            allowed_roles=allowed_roles,
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract Document entities, approval relationships, and governance evidence."""
        entities = [{
            "entity_id": f"DOCUMENT:{normalized.source_record_id}",
            "entity_type": "DOCUMENT",
            "name": normalized.title,
            "project_id": normalized.project_id,
            "status": normalized.status,
            "metadata": {
                "document_type": normalized.record_type,
                "url": normalized.source_url,
                "classification": normalized.classification
            }
        }]

        relationships = [
            {
                "source_entity_id": f"DOCUMENT:{normalized.source_record_id}",
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "APPROVES" if normalized.status == "Approved" else "HAS_DOCUMENT",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": f"DOCUMENT:{normalized.source_record_id}",
            "source_item_id": f"sharepoint:{normalized.source_record_id}",
            "statements": f"SharePoint {normalized.record_type} '{normalized.title}' status is {normalized.status}. {normalized.content}",
            "authority": "governance",
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
