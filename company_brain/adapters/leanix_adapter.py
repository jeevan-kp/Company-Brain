from typing import Any, Dict, List, Optional
from .base import BaseAdapter, NormalizedRecord, SemanticExtraction, IngestResult
from .clients.leanix_client import LeanIXGraphQLClient
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class LeanixAdapter(BaseAdapter):
    source_system = "leanix"

    def __init__(self, client: Optional[LeanIXGraphQLClient] = None):
        self.client = client or LeanIXGraphQLClient()

    async def fetch_changes(self, since_watermark: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Executes LeanIX GraphQL allFactSheets query to retrieve application & project fact sheets.
        Returns the raw nodes inside data.allFactSheets.edges.
        """
        query = """
        query GetAllFactSheets {
          allFactSheets {
            totalCount
            edges {
              node {
                id
                name
                displayName
                fullName
                type
                category
                description
                status
                lxState
                qualitySealStatus
                score
                rev
                createdAt
                updatedAt
                approvedAt
                lifecycle {
                  asString
                  phases {
                    phase
                    startDate
                    endDate
                  }
                }
                tags {
                  id
                  name
                  tagGroup {
                    id
                    name
                    shortName
                  }
                }
                fields {
                  name
                  data
                  dataType {
                    type
                    mandatory
                  }
                }
                relations {
                  id
                  displayNameToFS
                  typeFromFS
                  typeToFS
                  fromId
                  toId
                  status
                  type
                  factSheet {
                    id
                    name
                    type
                  }
                  fields {
                    name
                    data
                  }
                }
                milestones {
                  id
                  date
                  name
                  description
                }
                completion {
                  type
                  completion
                  percentage
                  subCompletions
                }
                documents {
                  id
                  name
                  description
                  url
                  origin
                  documentType
                  createdAt
                }
                comments {
                  id
                  factSheetId
                  message
                  status
                  userId
                  createdAt
                }
                subscriptions {
                  id
                  userId
                  type
                  linkedRoles {
                    roleId
                    name
                    description
                  }
                  roles {
                    id
                    name
                    subscriptionType
                  }
                }
                permissions {
                  self
                  read
                  update
                }
              }
            }
          }
        }
        """
        resp = await self.client.execute_graphql(query)
        edges = resp.get("data", {}).get("allFactSheets", {}).get("edges", [])
        return [edge.get("node", {}) for edge in edges if edge.get("node")]

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedRecord:
        """Stage 1: Normalize exact LeanIX FactSheet GraphQL/REST node into NormalizedRecord."""
        app_id = raw_record.get("id", "")
        name = raw_record.get("name") or raw_record.get("displayName") or "Unnamed FactSheet"
        record_type = raw_record.get("type", "Application")
        
        # Extract classification from fields or default to Internal
        classification = "Internal"
        fields = raw_record.get("fields", [])
        for f in fields:
            if f.get("name") == "informationClassification":
                val = f.get("data", {})
                if isinstance(val, dict):
                    classification = val.get("value", "Internal")
                elif isinstance(val, str):
                    classification = val

        # Extract project binding from tags
        project_id = "ATLAS"
        tags = raw_record.get("tags", [])
        for tag in tags:
            tag_name = tag.get("name", "")
            if tag_name.startswith("project:"):
                project_id = tag_name.split("project:")[1].upper()
                break

        allowed_roles = ["architect", "project_manager", "developer", "support"]
        if classification == "Confidential":
            allowed_roles = ["architect", "project_manager"]
        elif classification == "Strictly Confidential":
            allowed_roles = ["architect"]

        lifecycle_str = raw_record.get("lifecycle", {}).get("asString") or raw_record.get("status", "ACTIVE").lower()

        # Extract owners from subscriptions
        owner = "Enterprise Architecture"
        assignee = ""
        subscriptions = raw_record.get("subscriptions", [])
        for sub in subscriptions:
            if sub.get("type") == "ACCOUNTABLE":
                owner = sub.get("userId", owner)
            elif sub.get("type") == "RESPONSIBLE":
                assignee = sub.get("userId", assignee)

        # Parse timestamps
        created_dt = datetime.utcnow()
        if raw_record.get("createdAt"):
            try:
                created_dt = datetime.fromisoformat(raw_record["createdAt"].replace("Z", "+00:00"))
            except Exception:
                pass

        updated_dt = datetime.utcnow()
        if raw_record.get("updatedAt"):
            try:
                updated_dt = datetime.fromisoformat(raw_record["updatedAt"].replace("Z", "+00:00"))
            except Exception:
                pass

        return NormalizedRecord(
            source_system=self.source_system,
            source_record_id=app_id,
            source_url=f"https://app.leanix.net/factsheets/{record_type}/{app_id}",
            record_type=record_type,
            project_id=project_id,
            title=name,
            content=raw_record.get("description", f"LeanIX {record_type} FactSheet for {name}"),
            status=lifecycle_str,
            priority="Medium",
            owner=owner,
            assignee=assignee,
            labels=[t.get("name") for t in tags if "name" in t],
            project_key=project_id,
            components=[name],
            created=created_dt,
            updated=updated_dt,
            classification=classification,
            allowed_roles=allowed_roles,
            raw_payload=raw_record
        )

    def extract_semantics(self, normalized: NormalizedRecord) -> SemanticExtraction:
        """Stage 2: Extract entities, dependencies, milestones, documents, subscriptions, and evidence."""
        raw = normalized.raw_payload
        record_type = normalized.record_type.upper()
        entity_id = f"{record_type}:{normalized.title.upper().replace(' ', '-')}"

        completion_info = raw.get("completion", {})
        completion_pct = completion_info.get("percentage", 90)
        quality_score = raw.get("score", 90)
        quality_seal = raw.get("qualitySealStatus", "APPROVED")

        # 1. Primary Entity
        entities = [{
            "entity_id": entity_id,
            "entity_type": record_type,
            "name": normalized.title,
            "display_name": raw.get("displayName", normalized.title),
            "project_id": normalized.project_id,
            "status": normalized.status,
            "metadata": {
                "leanix_id": normalized.source_record_id,
                "technical_owner": normalized.owner,
                "business_owner": normalized.assignee,
                "classification": normalized.classification,
                "quality_score": quality_score,
                "completion_percentage": completion_pct,
                "quality_seal_status": quality_seal,
                "lx_state": raw.get("lxState", "APPROVED"),
                "revision": raw.get("rev", 1),
                "approved_at": raw.get("approvedAt")
            }
        }]

        relationships = [
            {
                "source_entity_id": entity_id,
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "USED_BY",
                "active": True
            }
        ]

        evidence = [{
            "entity_id": entity_id,
            "source_item_id": f"leanix:{normalized.source_record_id}",
            "statements": f"LeanIX FactSheet {normalized.title} ({normalized.source_record_id}) is marked {normalized.status} with {quality_seal} Quality Seal (Completion: {completion_pct}%, Score: {quality_score}/100).",
            "authority": "architectural",
            "confidence": 1.0,
            "allowed_roles": normalized.allowed_roles
        }]

        # 2. Extract Relations from raw FactSheet
        raw_relations = raw.get("relations", [])
        for rel in raw_relations:
            target_fs = rel.get("factSheet", {})
            target_type = target_fs.get("type", "Application").upper()
            target_name = target_fs.get("name", "Target")
            target_entity_id = f"{target_type}:{target_name.upper().replace(' ', '-')}"
            rel_type = rel.get("type", "relApplicationToApplication")

            # Map LeanIX relation type to semantic edge label
            mapped_rel = "CONNECTS_VIA"
            if "ITComponent" in rel_type:
                mapped_rel = "HOSTED_ON"
            elif "BusinessCapability" in rel_type:
                mapped_rel = "SUPPORTS_CAPABILITY"
            elif "Project" in rel_type:
                mapped_rel = "USED_BY"

            relationships.append({
                "source_entity_id": entity_id,
                "target_entity_id": target_entity_id,
                "relationship_type": mapped_rel,
                "active": rel.get("status") == "ACTIVE"
            })

        # 3. Extract Milestones
        raw_milestones = raw.get("milestones", [])
        for ms in raw_milestones:
            ms_id = f"MILESTONE:{normalized.project_id}-{ms.get('id', 'MS')}"
            entities.append({
                "entity_id": ms_id,
                "entity_type": "MILESTONE",
                "name": ms.get("name", "Milestone"),
                "project_id": normalized.project_id,
                "status": "SCHEDULED",
                "metadata": {
                    "target_date": ms.get("date"),
                    "description": ms.get("description")
                }
            })
            relationships.append({
                "source_entity_id": ms_id,
                "target_entity_id": f"PROJECT:{normalized.project_id}",
                "relationship_type": "MILESTONE_FOR",
                "active": True
            })

        # 4. Extract Documents
        raw_docs = raw.get("documents", [])
        for doc in raw_docs:
            doc_id = f"DOCUMENT:{doc.get('name', 'DOC').upper().replace(' ', '-')}"
            entities.append({
                "entity_id": doc_id,
                "entity_type": "DOCUMENT",
                "name": doc.get("name"),
                "project_id": normalized.project_id,
                "status": "APPROVED",
                "metadata": {
                    "url": doc.get("url"),
                    "document_type": doc.get("documentType"),
                    "origin": doc.get("origin")
                }
            })
            relationships.append({
                "source_entity_id": doc_id,
                "target_entity_id": entity_id,
                "relationship_type": "DOCUMENT_FOR",
                "active": True
            })

        # 5. Extract Subscriptions (People / Roles)
        raw_subs = raw.get("subscriptions", [])
        for sub in raw_subs:
            user_id = sub.get("userId", "")
            if user_id:
                person_name = user_id.split("@")[0].replace(".", " ").title()
                person_id = f"PERSON:{person_name.upper().replace(' ', '-')}"
                entities.append({
                    "entity_id": person_id,
                    "entity_type": "PERSON",
                    "name": person_name,
                    "project_id": normalized.project_id,
                    "status": "ACTIVE",
                    "metadata": {
                        "email": user_id,
                        "subscription_type": sub.get("type"),
                        "roles": [r.get("name") for r in sub.get("linkedRoles", [])]
                    }
                })
                relationships.append({
                    "source_entity_id": person_id,
                    "target_entity_id": entity_id,
                    "relationship_type": "ACCOUNTABLE_FOR" if sub.get("type") == "ACCOUNTABLE" else "RESPONSIBLE_FOR",
                    "active": True
                })

        aliases = [
            normalized.title,
            normalized.title.lower(),
            normalized.title.upper().replace(' ', '-'),
            raw.get("displayName", normalized.title),
            raw.get("fullName", normalized.title)
        ]

        return SemanticExtraction(
            entities=entities,
            relationships=relationships,
            evidence=evidence,
            aliases=list(set(aliases))
        )

    async def ingest(self, project_config: Dict[str, Any]) -> IngestResult:
        records = await self.fetch_changes()
        for raw in records:
            norm = self.normalize(raw)
            self.extract_semantics(norm)
        return IngestResult(fetched=len(records), new=len(records), updated=0, unchanged=0)
