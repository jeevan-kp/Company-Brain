from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.teams_client import TeamsGraphClient
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TeamsAdapter(BaseAdapter):
    source_system = "teams"

    def __init__(self, client: Optional[TeamsGraphClient] = None):
        self.client = client or TeamsGraphClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch channel messages and meetings from Microsoft Graph API."""
        resp = await self.client.get_channel_messages(team_id="team-atlas-01", channel_id="atlas-general")
        messages = resp.get("value", [])
        
        # Also fetch meeting decision records
        meeting = await self.client.get_meeting_transcripts("meeting-atlas-arch-review")
        if meeting:
            messages.append(meeting)
            
        return messages

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize Microsoft Graph chatMessage or onlineMeeting into NormalizedRecord."""
        is_meeting = "subject" in raw_record or "@odata.context" in raw_record and "onlineMeetings" in raw_record["@odata.context"]
        record_type = "Meeting" if is_meeting else "Message"
        source_id = raw_record.get("id", "")
        
        if is_meeting:
            title = raw_record.get("subject", "Architecture Meeting")
            content = " ".join(raw_record.get("decisions", [])) + " Transcript: " + raw_record.get("transcript_summary", "")
            owner = raw_record.get("participants", {}).get("organizer", {}).get("identity", {}).get("user", {}).get("displayName", "Organizer")
        else:
            title = f"Teams Chat in {raw_record.get('channelIdentity', {}).get('channelId', 'channel')}"
            body_html = raw_record.get("body", {}).get("content", "")
            # Simple strip of HTML tags
            content = body_html.replace("<p>", "").replace("</p>", "").replace("<code>", "").replace("</code>", "")
            owner = raw_record.get("from", {}).get("user", {}).get("displayName", "Team Member")

        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=source_id,
            source_url=raw_record.get("webUrl", ""),
            record_type=record_type,
            project_id="ATLAS",
            title=title,
            content=content,
            status="Completed",
            priority="High" if raw_record.get("importance") == "high" else "Medium",
            owner=owner,
            assignee="",
            labels=["chat" if not is_meeting else "meeting", "governance" if is_meeting else "informal"],
            project_key="",
            components=[],
            created=datetime.utcnow(),
            updated=datetime.utcnow(),
            classification="Internal",
            allowed_roles=["project_manager", "developer", "architect", "support"],
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract Discussion and Decision entities from Teams / Meeting content."""
        is_meeting = normalized.record_type == "Meeting"
        
        entities = [{
            "entity_id": f"{'MEETING' if is_meeting else 'DECISION'}:{normalized.source_record_id}",
            "entity_type": "MEETING" if is_meeting else "DECISION",
            "name": normalized.title,
            "project_id": normalized.project_id,
            "status": "Discussed" if not is_meeting else "Decided",
            "metadata": {
                "author": normalized.owner,
                "importance": normalized.priority
            }
        }]

        relationships = [
            {
                "source_entity_id": f"{'MEETING' if is_meeting else 'DECISION'}:{normalized.source_record_id}",
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "DISCUSSED_IN" if not is_meeting else "HAS_MEETING",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": f"{'MEETING' if is_meeting else 'DECISION'}:{normalized.source_record_id}",
            "source_item_id": f"teams:{normalized.source_record_id}",
            "statements": f"[{normalized.owner}]: {normalized.content}",
            "authority": "governance" if is_meeting else "informal",
            "confidence": 1.0 if is_meeting else 0.7,
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
