"""
Atlassian Cloud REST API Client for Jira & Confluence
Supports live trial/production credentials (JIRA_API_TOKEN, CONFLUENCE_API_TOKEN)
and authentic mock simulation matching Jira REST API v3 / Confluence REST API v2 schemas.
"""
import os
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)

class AtlassianClient:
    def __init__(self):
        self.jira_url = os.getenv("JIRA_URL") or os.getenv("JIRA_INSTANCE_URL")
        self.jira_user = os.getenv("JIRA_USER_EMAIL")
        self.jira_token = os.getenv("JIRA_API_TOKEN")
        
        self.confluence_url = os.getenv("CONFLUENCE_URL") or os.getenv("CONFLUENCE_INSTANCE_URL")
        self.confluence_user = os.getenv("CONFLUENCE_USER_EMAIL") or self.jira_user
        self.confluence_token = os.getenv("CONFLUENCE_API_TOKEN") or self.jira_token

    async def search_jira_issues(self, jql: str = "project = ATL") -> Dict[str, Any]:
        """Fetch Jira issues using Jira REST API v3 /rest/api/3/search."""
        if self.jira_url and self.jira_token and self.jira_user:
            try:
                auth = (self.jira_user, self.jira_token)
                headers = {"Accept": "application/json", "Content-Type": "application/json"}
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        f"{self.jira_url.rstrip('/')}/rest/api/3/search",
                        params={"jql": jql, "maxResults": 50},
                        auth=auth,
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"Jira live API call failed, falling back to simulated payload: {e}")

        return self._generate_simulated_jira_issues()

    async def get_confluence_pages(self, space_key: str = "ATLAS") -> Dict[str, Any]:
        """Fetch Confluence pages using Confluence REST API v2 /wiki/api/v2/pages."""
        if self.confluence_url and self.confluence_token and self.confluence_user:
            try:
                auth = (self.confluence_user, self.confluence_token)
                headers = {"Accept": "application/json"}
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        f"{self.confluence_url.rstrip('/')}/wiki/api/v2/pages",
                        params={"spaceKey": space_key, "body-format": "storage"},
                        auth=auth,
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"Confluence live API call failed, falling back to simulated payload: {e}")

        return self._generate_simulated_confluence_pages(space_key)

    def _generate_simulated_jira_issues(self) -> Dict[str, Any]:
        """Generates realistic Jira REST API v3 search response with issues and changelog."""
        issues = [
            {
                "id": "10001",
                "key": "ATL-1",
                "self": "https://company-brain.atlassian.net/rest/api/3/issue/10001",
                "fields": {
                    "summary": "Supplier Integration Modernization Epic",
                    "description": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Replace legacy IDOC with API Gateway."}]}]},
                    "issuetype": {"name": "Epic"},
                    "status": {"name": "In Progress", "statusCategory": {"key": "indeterminate", "name": "In Progress"}},
                    "priority": {"name": "High"},
                    "assignee": {"displayName": "Praneetha", "accountId": "user_pm_01"},
                    "reporter": {"displayName": "Jeevan", "accountId": "user_arch_01"},
                    "labels": ["project:ATLAS", "source-to-pay"],
                    "components": [{"name": "ORDER-HUB"}],
                    "created": "2026-08-01T10:00:00.000+0000",
                    "updated": "2026-10-06T12:00:00.000+0000",
                    "duedate": "2026-11-30"
                }
            },
            {
                "id": "10004",
                "key": "ATL-4",
                "self": "https://company-brain.atlassian.net/rest/api/3/issue/10004",
                "fields": {
                    "summary": "OAuth token refresh intermittent failure during supplier batch upload",
                    "description": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Batch token refresh expires prematurely causing HTTP 401 defects."}]}]},
                    "issuetype": {"name": "Bug"},
                    "status": {"name": "Open", "statusCategory": {"key": "new", "name": "To Do"}},
                    "priority": {"name": "Critical"},
                    "assignee": {"displayName": "Developer 01", "accountId": "developer_01"},
                    "labels": ["project:ATLAS", "blocker", "security"],
                    "components": [{"name": "ORDER-HUB"}],
                    "created": "2026-10-02T14:30:00.000+0000",
                    "updated": "2026-10-06T09:15:00.000+0000"
                }
            },
            {
                "id": "10006",
                "key": "ATL-6",
                "self": "https://company-brain.atlassian.net/rest/api/3/issue/10006",
                "fields": {
                    "summary": "Supplier API authentication defect",
                    "description": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Supplier API fails authentication verification under concurrent requests."}]}]},
                    "issuetype": {"name": "Bug"},
                    "status": {"name": "Open", "statusCategory": {"key": "new", "name": "To Do"}},
                    "priority": {"name": "Critical"},
                    "assignee": {"displayName": "Developer 01", "accountId": "developer_01"},
                    "labels": ["project:ATLAS", "blocker", "critical-readiness"],
                    "components": [{"name": "ORDER-HUB"}],
                    "created": "2026-10-03T11:00:00.000+0000",
                    "updated": "2026-10-06T10:00:00.000+0000"
                }
            }
        ]
        return {
            "startAt": 0,
            "maxResults": 50,
            "total": len(issues),
            "issues": issues
        }

    def _generate_simulated_confluence_pages(self, space_key: str) -> Dict[str, Any]:
        """Generates realistic Confluence REST API v2 page response."""
        pages = [
            {
                "id": "65536001",
                "status": "current",
                "title": "ADR-001 - Supplier Connectivity via API Gateway",
                "spaceId": "123456",
                "version": {"number": 3, "createdAt": "2026-09-15T10:00:00Z"},
                "body": {
                    "storage": {
                        "value": "<p><strong>Decision:</strong> All external supplier integrations must route exclusively through the SAP API Gateway. Direct database connectivity is strictly rejected due to compliance and security mandates.</p>",
                        "representation": "storage"
                    }
                },
                "_links": {"webui": "/spaces/ATLAS/pages/65536001/ADR-001"}
            },
            {
                "id": "65536002",
                "status": "current",
                "title": "Atlas Production Readiness Checklist",
                "spaceId": "123456",
                "version": {"number": 1, "createdAt": "2026-10-01T08:00:00Z"},
                "body": {
                    "storage": {
                        "value": "<p>Architecture approved. Rollback strategy defined. Pending Jira critical defect resolution.</p>",
                        "representation": "storage"
                    }
                },
                "_links": {"webui": "/spaces/ATLAS/pages/65536002/Atlas-Readiness"}
            }
        ]
        return {"results": pages}
