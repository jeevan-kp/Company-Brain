from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GithubAdapter(BaseAdapter):
    source_system = "github"

    def __init__(self, api_token: str):
        self.api_token = api_token

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        logger.info(f"Fetching GitHub changes since {since_watermark}")
        return []

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=raw_record.get("commit_sha", raw_record.get("path", "")),
            source_url=f"github.com/{raw_record.get('repo_full_name')}/{raw_record.get('path')}",
            record_type="File",
            project_id=raw_record.get("project_id", "UNKNOWN"),
            title=raw_record.get("path", ""),
            content=raw_record.get("content", ""),
            status="Active",
            priority="Medium",
            owner=raw_record.get("author", ""),
            assignee="",
            labels=raw_record.get("topics", []),
            project_key=raw_record.get("repo_full_name", ""),
            components=[],
            created=datetime.utcnow(),
            updated=raw_record.get("last_modified", datetime.utcnow()),
            classification="Internal",
            allowed_roles=["developer", "architect", "support"],
            raw_payload=raw_record,
            content_hash=raw_record.get("content_hash", "")
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        entities = [{
            "id": normalized.source_record_id,
            "type": "CodeFile",
            "name": normalized.title,
        }]
        return SemanticExtraction(entities=entities, relationships=[], evidence=[], aliases=[])

    async def ingest(self, project_config: Dict[str, Any]) -> IngestResult:
        return IngestResult(fetched=0, new=0, updated=0, unchanged=0)
