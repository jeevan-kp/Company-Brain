from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.servicenow_client import ServiceNowTableClient
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ServicenowAdapter(BaseAdapter):
    source_system = "servicenow"

    def __init__(self, client: Optional[ServiceNowTableClient] = None):
        self.client = client or ServiceNowTableClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch incidents and change requests via ServiceNow Table API."""
        incidents_resp = await self.client.get_records("incident")
        changes_resp = await self.client.get_records("change_request")
        
        all_records = []
        all_records.extend(incidents_resp.get("result", []))
        all_records.extend(changes_resp.get("result", []))
        return all_records

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize ServiceNow Table API record into NormalizedRecord."""
        number = raw_record.get("number", "")
        is_incident = number.startswith("INC") or "short_description" in raw_record and "incident" in raw_record.get("sys_id", "")
        record_type = "Incident" if is_incident else "Change"
        
        sys_id = raw_record.get("sys_id", "")
        short_desc = raw_record.get("short_description", "")
        description = raw_record.get("description", short_desc)
        
        # Priority mapping: 1 = Critical, 2 = High, 3 = Moderate, 4 = Low
        priority_code = str(raw_record.get("priority", "3"))
        priority_map = {"1": "Critical", "2": "High", "3": "Moderate", "4": "Low"}
        priority = priority_map.get(priority_code, "Medium")
        
        # State mapping
        state = raw_record.get("state", "New")
        project_id = raw_record.get("u_project_id", "ATLAS")
        app_name = raw_record.get("cmdb_ci", {}).get("display_value", "ORDER-HUB") if isinstance(raw_record.get("cmdb_ci"), dict) else str(raw_record.get("cmdb_ci", "ORDER-HUB"))

        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=number or sys_id,
            source_url=f"https://service-now.internal/nav_to.do?uri={record_type.lower()}.do?sys_id={sys_id}",
            record_type=record_type,
            project_id=project_id,
            title=f"[{number}] {short_desc}",
            content=f"{description} (Work Notes: {raw_record.get('work_notes', '')})",
            status="Open" if state in ["1", "2", "New", "In Progress"] else "Resolved",
            priority=priority,
            owner=raw_record.get("assigned_to", {}).get("display_value", "") if isinstance(raw_record.get("assigned_to"), dict) else str(raw_record.get("assigned_to", "")),
            assignee=raw_record.get("assignment_group", {}).get("display_value", "") if isinstance(raw_record.get("assignment_group"), dict) else str(raw_record.get("assignment_group", "")),
            labels=[app_name, record_type],
            project_key="",
            components=[app_name],
            created=datetime.utcnow(),
            updated=datetime.utcnow(),
            classification="Internal",
            allowed_roles=["project_manager", "architect", "support", "developer"],
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract Incident/Change entities, AFFECTS relationships, and operational evidence."""
        is_incident = normalized.record_type == "Incident"
        
        entities = [{
            "entity_id": f"{'ISSUE' if is_incident else 'CHANGE'}:{normalized.source_record_id}",
            "entity_type": "ISSUE" if is_incident else "CHANGE",
            "name": normalized.title,
            "project_id": normalized.project_id,
            "status": normalized.status,
            "metadata": {
                "priority": normalized.priority,
                "components": normalized.components
            }
        }]

        relationships = [
            {
                "source_entity_id": f"{'ISSUE' if is_incident else 'CHANGE'}:{normalized.source_record_id}",
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "HAS_INCIDENT" if is_incident else "HAS_CHANGE",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": f"{'ISSUE' if is_incident else 'CHANGE'}:{normalized.source_record_id}",
            "source_item_id": f"servicenow:{normalized.source_record_id}",
            "statements": f"ServiceNow {normalized.record_type} {normalized.title} has priority {normalized.priority} and status {normalized.status}. {normalized.content}",
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
