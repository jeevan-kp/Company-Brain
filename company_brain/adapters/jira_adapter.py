from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.atlassian_client import AtlassianClient
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class JiraAdapter(BaseAdapter):
    source_system = "jira"

    def __init__(self, client: Optional[AtlassianClient] = None):
        self.client = client or AtlassianClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch Jira issues using Jira REST API v3 search."""
        jql = "project = ATL order by created DESC"
        resp = await self.client.search_jira_issues(jql)
        return resp.get("issues", [])

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize Jira REST API v3 issue into NormalizedRecord."""
        key = raw_record.get("key", "")
        fields = raw_record.get("fields", {})
        summary = fields.get("summary", "")
        
        # Extract description text
        desc_obj = fields.get("description")
        description = summary
        if isinstance(desc_obj, dict):
            # Extract plain text from ADF (Atlassian Document Format)
            content_list = desc_obj.get("content", [])
            for c in content_list:
                for p in c.get("content", []):
                    if p.get("text"):
                        description = p.get("text")
                        break
        elif isinstance(desc_obj, str):
            description = desc_obj

        status = fields.get("status", {}).get("name", "Open")
        priority = fields.get("priority", {}).get("name", "Medium")
        assignee = fields.get("assignee", {}).get("displayName", "Unassigned") if fields.get("assignee") else "Unassigned"
        reporter = fields.get("reporter", {}).get("displayName", "Reporter") if fields.get("reporter") else "Reporter"
        labels = fields.get("labels", [])
        components = [c.get("name") for c in fields.get("components", []) if isinstance(c, dict)]

        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=key,
            source_url=f"https://company-brain.atlassian.net/browse/{key}",
            record_type="Issue",
            project_id="ATLAS",
            title=f"[{key}] {summary}",
            content=description,
            status=status,
            priority=priority,
            owner=reporter,
            assignee=assignee,
            labels=labels,
            project_key="ATL",
            components=components,
            created=datetime.utcnow(),
            updated=datetime.utcnow(),
            classification="Internal",
            allowed_roles=["project_manager", "developer", "architect", "support"],
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract Issue entity, BLOCKS relationships, and operational evidence."""
        is_blocker = normalized.priority == "Critical" or "blocker" in normalized.labels
        
        entities = [{
            "entity_id": f"ISSUE:{normalized.source_record_id}",
            "entity_type": "ISSUE",
            "name": normalized.title,
            "project_id": normalized.project_id,
            "status": normalized.status,
            "metadata": {
                "priority": normalized.priority,
                "components": normalized.components,
                "assignee": normalized.assignee
            }
        }]

        relationships = [
            {
                "source_entity_id": f"ISSUE:{normalized.source_record_id}",
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "BLOCKS" if is_blocker and normalized.status != "Done" else "AFFECTS",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": f"ISSUE:{normalized.source_record_id}",
            "source_item_id": f"jira:{normalized.source_record_id}",
            "statements": f"Jira Issue {normalized.source_record_id} ({normalized.title}) is {normalized.status} with priority {normalized.priority}.",
            "authority": "operational",
            "confidence": 1.0,
            "allowed_roles": normalized.allowed_roles
        }]

        return SemanticExtraction(
            entities=entities,
            relationships=relationships,
            evidence=evidence,
            aliases=[normalized.source_record_id, normalized.title]
        )

    async def ingest(self, project_config: Dict[str, Any]) -> IngestResult:
        records = await self.fetch_changes()
        for raw in records:
            norm = self.normalize(raw)
            self.extract_semantics(norm)
        return IngestResult(fetched=len(records), new=len(records), updated=0, unchanged=0)
