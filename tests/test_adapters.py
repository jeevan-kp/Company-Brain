"""
Tests for live/simulated Enterprise Adapters and Authentic Clients.
Verifies exact official schema parsing for LeanIX, SharePoint, Teams, ServiceNow, Jira, and Confluence.
"""
import asyncio
import pytest
from company_brain.adapters.clients import (
    LeanIXGraphQLClient,
    SharePointGraphClient,
    TeamsGraphClient,
    ServiceNowTableClient,
    AtlassianClient
)
from company_brain.adapters.leanix_adapter import LeanixAdapter
from company_brain.adapters.sharepoint_adapter import SharepointAdapter
from company_brain.adapters.teams_adapter import TeamsAdapter
from company_brain.adapters.servicenow_adapter import ServicenowAdapter
from company_brain.adapters.jira_adapter import JiraAdapter
from company_brain.adapters.confluence_adapter import ConfluenceAdapter

def test_leanix_graphql_and_rest_client_and_adapter():
    async def _run():
        client = LeanIXGraphQLClient()
        adapter = LeanixAdapter(client=client)
        
        # 1. Test OpenAPI REST endpoint format
        rest_resp = await client.get_factsheets_rest()
        assert rest_resp["status"] == "OK"
        assert rest_resp["type"] == "FactSheetListResponse"
        assert "data" in rest_resp
        assert len(rest_resp["data"]) >= 6
        
        first_fs = rest_resp["data"][0]
        assert "completion" in first_fs
        assert first_fs["completion"]["percentage"] >= 90
        assert "subCompletions" in first_fs["completion"]
        assert "milestones" in first_fs
        assert len(first_fs["milestones"]) > 0
        assert "documents" in first_fs
        assert "subscriptions" in first_fs
        assert "relations" in first_fs
        assert first_fs["qualitySealStatus"] == "APPROVED"
        assert "score" in first_fs

        # 2. Fetch raw GraphQL response & normalize
        raw_nodes = await adapter.fetch_changes()
        assert len(raw_nodes) > 0
        first = raw_nodes[0]
        assert "id" in first
        assert "name" in first
        assert first["type"] == "Application"
        
        norm = adapter.normalize(first)
        assert norm.source_system == "leanix"
        assert norm.title == "Order Hub"
        assert norm.project_id == "ATLAS"
        assert "jeevan" in norm.owner.lower()
        
        # 3. Semantic Extraction: verifies entities, relations, milestones, documents, subscriptions
        extraction = adapter.extract_semantics(norm)
        assert len(extraction.entities) >= 4  # Application + Milestones + Documents + Subscriptions
        primary_entity = extraction.entities[0]
        assert primary_entity["entity_id"] == "APPLICATION:ORDER-HUB"
        assert primary_entity["metadata"]["completion_percentage"] == 95
        assert primary_entity["metadata"]["quality_seal_status"] == "APPROVED"
        
        # Check relationships (connects via, used by, documents, milestones)
        assert len(extraction.relationships) >= 4
        assert len(extraction.evidence) > 0
        assert extraction.evidence[0]["authority"] == "architectural"
    asyncio.run(_run())

def test_sharepoint_graph_client_and_adapter():
    async def _run():
        client = SharePointGraphClient()
        adapter = SharepointAdapter(client=client)
        
        # 1. Fetch Microsoft Graph drive items
        items = await adapter.fetch_changes()
        assert len(items) > 0
        sec_app = next(i for i in items if "SECAPP" in i["id"])
        assert "@odata.context" not in sec_app  # list items extracted from value envelope
        assert "fields" in sec_app
        assert sec_app["fields"]["ApprovalStatus"] == "Approved"
        
        # 2. Normalize
        norm = adapter.normalize(sec_app)
        assert norm.source_system == "sharepoint"
        assert norm.classification == "Confidential"
        assert "architect" in norm.allowed_roles
        
        # 3. Semantic Extraction
        extraction = adapter.extract_semantics(norm)
        assert len(extraction.evidence) > 0
        assert extraction.evidence[0]["authority"] == "governance"
    asyncio.run(_run())

def test_teams_graph_client_and_adapter():
    async def _run():
        client = TeamsGraphClient()
        adapter = TeamsAdapter(client=client)
        
        # 1. Fetch channel messages & meetings
        messages = await adapter.fetch_changes()
        assert len(messages) >= 2
        
        # 2. Find conflict message
        conflict_msg = next(m for m in messages if "atlas-prod-db" in str(m.get("body", {}).get("content", "")))
        norm = adapter.normalize(conflict_msg)
        assert "atlas-prod-db" in norm.content
        assert norm.owner.startswith("Developer")
        
        # 3. Extraction
        extraction = adapter.extract_semantics(norm)
        assert len(extraction.evidence) > 0
        assert extraction.evidence[0]["authority"] == "informal"
    asyncio.run(_run())

def test_servicenow_table_client_and_adapter():
    async def _run():
        client = ServiceNowTableClient()
        adapter = ServicenowAdapter(client=client)
        
        # 1. Fetch ServiceNow incidents & changes
        records = await adapter.fetch_changes()
        assert len(records) > 0
        inc = next(r for r in records if r.get("number", "").startswith("INC"))
        assert inc["priority"] == "1"
        
        # 2. Normalize
        norm = adapter.normalize(inc)
        assert norm.source_system == "servicenow"
        assert norm.priority == "Critical"
        assert norm.status == "Open"
        
        # 3. Extraction
        extraction = adapter.extract_semantics(norm)
        assert len(extraction.entities) > 0
        assert extraction.entities[0]["entity_type"] == "ISSUE"
    asyncio.run(_run())

def test_atlassian_jira_and_confluence():
    async def _run():
        client = AtlassianClient()
        jira_adapter = JiraAdapter(client=client)
        conf_adapter = ConfluenceAdapter(client=client)
        
        # Jira
        issues = await jira_adapter.fetch_changes()
        assert len(issues) >= 2
        atl6 = next(i for i in issues if i["key"] == "ATL-6")
        norm_jira = jira_adapter.normalize(atl6)
        assert norm_jira.priority == "Critical"
        ext_jira = jira_adapter.extract_semantics(norm_jira)
        assert ext_jira.relationships[0]["relationship_type"] == "BLOCKS"
        
        # Confluence
        pages = await conf_adapter.fetch_changes()
        assert len(pages) >= 1
        adr = next(p for p in pages if "ADR-001" in p["title"])
        norm_conf = conf_adapter.normalize(adr)
        assert norm_conf.record_type == "ADR"
        ext_conf = conf_adapter.extract_semantics(norm_conf)
        assert ext_conf.evidence[0]["authority"] == "architectural"
    asyncio.run(_run())
