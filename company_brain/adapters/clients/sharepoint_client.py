"""
Microsoft Graph API Client for SharePoint Document Libraries
Supports live execution (GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives/{driveId}/root/children)
and authentic mock simulation matching the exact official Microsoft Graph v1.0 schema.
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx

logger = logging.getLogger(__name__)

class SharePointGraphClient:
    def __init__(self, tenant_id: Optional[str] = None, client_id: Optional[str] = None, client_secret: Optional[str] = None, access_token: Optional[str] = None):
        self.access_token = access_token or os.getenv("MS_GRAPH_ACCESS_TOKEN")
        self.is_live = bool(self.access_token)

    async def get_drive_items(self, site_id: str = "root", drive_id: str = "default") -> Dict[str, Any]:
        """Fetch files and governance documents from SharePoint document library via Microsoft Graph API."""
        if self.is_live:
            try:
                headers = {
                    "Authorization": f"Bearer {self.access_token}",
                    "Accept": "application/json"
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children?$expand=fields",
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"SharePoint Graph live API call failed, falling back to simulated payload: {e}")

        return self._generate_simulated_drive_items_response()

    def _generate_simulated_drive_items_response(self) -> Dict[str, Any]:
        """
        Generates realistic Microsoft Graph DriveItems response for enterprise governance.
        Contains standard @odata metadata and DriveItem properties with expanded list fields.
        """
        now = datetime.now(timezone.utc).isoformat()
        
        items = [
            # ATLAS Documents
            {
                "id": "01ABCDEF-ATLAS-CHARTER-001",
                "name": "Project_Charter_Supplier_Integration.pdf",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/procurement/Shared%20Documents/atlas/Project_Charter_Supplier_Integration.pdf",
                "createdDateTime": "2026-08-01T09:00:00Z",
                "lastModifiedDateTime": "2026-08-15T14:30:00Z",
                "size": 1542000,
                "file": {"mimeType": "application/pdf"},
                "createdBy": {"user": {"displayName": "Jeevan (Lead Architect)", "email": "jeevan@daimlertruck.com"}},
                "lastModifiedBy": {"user": {"displayName": "Praneetha (Program Manager)", "email": "praneetha@daimlertruck.com"}},
                "fields": {
                    "Title": "Atlas Project Charter",
                    "ProjectID": "ATLAS",
                    "DocumentType": "Charter",
                    "ApprovalStatus": "Approved",
                    "Classification": "Internal",
                    "AllowedRoles": ["project_manager", "architect", "developer", "support"],
                    "Approver": "VP of Procurement IT",
                    "Version": "1.0"
                }
            },
            {
                "id": "01ABCDEF-ATLAS-SECAPP-002",
                "name": "Security_Architecture_Approval_Signoff.pdf",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/procurement/Shared%20Documents/atlas/Security_Architecture_Approval_Signoff.pdf",
                "createdDateTime": "2026-09-10T11:00:00Z",
                "lastModifiedDateTime": "2026-09-20T16:45:00Z",
                "size": 892000,
                "file": {"mimeType": "application/pdf"},
                "createdBy": {"user": {"displayName": "Cyber Security Auditor", "email": "security-audit@daimlertruck.com"}},
                "lastModifiedBy": {"user": {"displayName": "Chief Information Security Officer", "email": "ciso@daimlertruck.com"}},
                "fields": {
                    "Title": "Atlas Security Approval",
                    "ProjectID": "ATLAS",
                    "DocumentType": "Security Approval",
                    "ApprovalStatus": "Approved",
                    "Classification": "Confidential",
                    "AllowedRoles": ["project_manager", "architect"],
                    "Approver": "CISO Office",
                    "Summary": "Security Approval granted strictly requiring tokenized API Gateway access. Direct database access is strictly prohibited."
                }
            },
            {
                "id": "01ABCDEF-ATLAS-UAT-003",
                "name": "UAT_Signoff_Supplier_Integration.pdf",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/procurement/Shared%20Documents/atlas/UAT_Signoff_Supplier_Integration.pdf",
                "createdDateTime": "2026-09-28T08:30:00Z",
                "lastModifiedDateTime": "2026-10-02T10:15:00Z",
                "size": 654000,
                "file": {"mimeType": "application/pdf"},
                "createdBy": {"user": {"displayName": "QA Lead", "email": "qa-lead@daimlertruck.com"}},
                "lastModifiedBy": {"user": {"displayName": "Business Process Owner", "email": "bpo-procurement@daimlertruck.com"}},
                "fields": {
                    "Title": "Atlas UAT Sign-off",
                    "ProjectID": "ATLAS",
                    "DocumentType": "UAT Sign-off",
                    "ApprovalStatus": "Approved",
                    "Classification": "Internal",
                    "AllowedRoles": ["project_manager", "architect", "developer", "support"],
                    "Approver": "Head of Supplier Logistics"
                }
            },
            {
                "id": "01ABCDEF-ATLAS-CHECKLIST-004",
                "name": "Production_Readiness_Checklist_Atlas.xlsx",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/procurement/Shared%20Documents/atlas/Production_Readiness_Checklist_Atlas.xlsx",
                "createdDateTime": "2026-10-01T14:00:00Z",
                "lastModifiedDateTime": "2026-10-05T09:30:00Z",
                "size": 412000,
                "file": {"mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
                "createdBy": {"user": {"displayName": "Release Coordinator", "email": "release-mgmt@daimlertruck.com"}},
                "lastModifiedBy": {"user": {"displayName": "Release Coordinator", "email": "release-mgmt@daimlertruck.com"}},
                "fields": {
                    "Title": "Atlas Production Checklist",
                    "ProjectID": "ATLAS",
                    "DocumentType": "Production Checklist",
                    "ApprovalStatus": "Approved",
                    "Classification": "Internal",
                    "AllowedRoles": ["project_manager", "architect", "developer", "support"],
                    "Claim": "All critical defects resolved including supplier authentication issue.",
                    "Approver": "Release Management Board"
                }
            },
            {
                "id": "01ABCDEF-ATLAS-RUNBOOK-005",
                "name": "Atlas_Disaster_Recovery_and_Rollback_Runbook.docx",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/procurement/Shared%20Documents/atlas/Atlas_Disaster_Recovery_and_Rollback_Runbook.docx",
                "createdDateTime": "2026-10-04T16:00:00Z",
                "lastModifiedDateTime": "2026-10-06T11:20:00Z",
                "size": 780000,
                "file": {"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
                "createdBy": {"user": {"displayName": "DevOps Engineer", "email": "devops@daimlertruck.com"}},
                "lastModifiedBy": {"user": {"displayName": "DevOps Lead", "email": "devops-lead@daimlertruck.com"}},
                "fields": {
                    "Title": "Atlas Rollback Runbook",
                    "ProjectID": "ATLAS",
                    "DocumentType": "Runbook",
                    "ApprovalStatus": "Draft",
                    "Classification": "Internal",
                    "AllowedRoles": ["project_manager", "architect", "developer", "support"],
                    "Approver": "Pending Operations Signoff"
                }
            },
            # Governance documents for other projects
            {
                "id": "01ABCDEF-NOVA-CHARTER-006",
                "name": "Nova_Intercompany_Charter.pdf",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/finance/Shared%20Documents/nova/Nova_Intercompany_Charter.pdf",
                "createdDateTime": "2026-07-15T09:00:00Z",
                "lastModifiedDateTime": "2026-07-20T14:30:00Z",
                "size": 1200000,
                "file": {"mimeType": "application/pdf"},
                "fields": {
                    "Title": "Nova Intercompany Project Charter",
                    "ProjectID": "NOVA",
                    "DocumentType": "Charter",
                    "ApprovalStatus": "Approved",
                    "Classification": "Internal",
                    "AllowedRoles": ["project_manager", "architect", "developer", "support"]
                }
            },
            {
                "id": "01ABCDEF-PHX-SEC-007",
                "name": "OneERP_Country_Wave_Security_Signoff.pdf",
                "webUrl": "https://daimlertruck.sharepoint.com/sites/finance/Shared%20Documents/phoenix/OneERP_Country_Wave_Security_Signoff.pdf",
                "createdDateTime": "2026-08-10T10:00:00Z",
                "lastModifiedDateTime": "2026-08-15T15:00:00Z",
                "size": 940000,
                "file": {"mimeType": "application/pdf"},
                "fields": {
                    "Title": "Phoenix OneERP Security Approval",
                    "ProjectID": "PHOENIX",
                    "DocumentType": "Security Approval",
                    "ApprovalStatus": "Approved",
                    "Classification": "Confidential",
                    "AllowedRoles": ["project_manager", "architect"]
                }
            }
        ]

        return {
            "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('daimlertruck.sharepoint.com')/drives('root')/root/children",
            "value": items
        }
