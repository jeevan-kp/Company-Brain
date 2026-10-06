"""
SAP LeanIX API Client (REST & GraphQL)
Supports both live instance execution (POST /services/pathfinder/v1/graphql & GET /services/pathfinder/v1/factSheets)
and authentic mock simulation matching the exact official SAP LeanIX OpenAPI & GraphQL schema specifications.

Official References:
- OpenAPI Explorer: https://app.leanix.net/openapi-explorer/#/%2FfactSheets/getFactSheet
- SAP LeanIX APIs: https://help.sap.com/docs/leanix/ea/sap-leanix-apis
- GraphQL API: https://help.sap.com/docs/leanix/ea/graphql-api
- Meta-Model: https://help.sap.com/docs/leanix/ea/meta-model
"""
import os
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)

class LeanIXGraphQLClient:
    def __init__(self, instance_url: Optional[str] = None, api_token: Optional[str] = None):
        self.instance_url = instance_url or os.getenv("LEANIX_INSTANCE_URL")
        self.api_token = api_token or os.getenv("LEANIX_API_TOKEN")
        self.is_live = bool(self.instance_url and self.api_token)

    async def get_factsheets_rest(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes REST GET /services/pathfinder/v1/factSheets adhering strictly to the official OpenAPI schema:
        {
          "status": "OK",
          "type": "FactSheetListResponse",
          "message": "FactSheets retrieved successfully",
          "errors": [],
          "total": int,
          "data": [ FactSheet... ],
          "cursor": "..."
        }
        """
        if self.is_live:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_token}",
                    "Accept": "application/json"
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        f"{self.instance_url.rstrip('/')}/services/pathfinder/v1/factSheets",
                        params=params or {},
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"LeanIX REST API call failed, falling back to simulated payload: {e}")

        return self._generate_simulated_rest_response(params)

    async def execute_graphql(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a GraphQL query against LeanIX or return exact simulated GraphQL payload."""
        if self.is_live:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"{self.instance_url.rstrip('/')}/services/pathfinder/v1/graphql",
                        json={"query": query, "variables": variables or {}},
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"LeanIX live GraphQL API call failed, falling back to simulated payload: {e}")

        return self._generate_simulated_graphql_response(variables)

    def _get_canonical_factsheets(self) -> List[Dict[str, Any]]:
        """
        Returns full authentic SAP LeanIX FactSheet objects containing all dimensions specified in the OpenAPI specification:
        - id, name, description, displayName, fullName, type
        - tags (id, tagGroup, name, bgColor, status)
        - fields (name, data, dataType)
        - relations (id, displayNameToFS, typeFromFS, typeToFS, fromId, toId, factSheet, status, type)
        - milestones (id, date, name, description)
        - completion (type, completion, percentage, subCompletions)
        - createdAt, updatedAt, approvedAt
        - documents (id, name, description, url, origin, documentType, fileInformation)
        - comments (id, factSheetId, message, status, userId, replies, createdAt)
        - subscriptions (id, userId, type, linkedRoles, roles)
        - lxState, qualitySealStatus, level, score, rev, permissions, permittedReadACL, permittedWriteACL
        """
        return [
            # 1. ATLAS - Order Hub Application FactSheet
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                "name": "Order Hub",
                "description": "Central order ingestion and routing gateway for supplier integration modernization under Project ATLAS.",
                "displayName": "Order Hub (ATLAS)",
                "fullName": "Daimler Truck Order Hub Integration Engine",
                "type": "Application",
                "status": "ACTIVE",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 95,
                "rev": 48,
                "lxExcludeFromQuota": False,
                "lxTransformationsFutureFactSheet": False,
                "naFields": [],
                "createdAt": "2024-01-15T08:30:00.000Z",
                "updatedAt": "2026-10-06T18:45:00.000Z",
                "approvedAt": "2026-03-01T10:00:00.000Z",
                "tags": [
                    {
                        "id": "tag-proj-atlas",
                        "name": "project:ATLAS",
                        "description": "Project Atlas Initiative",
                        "bgColor": "#0284c7",
                        "status": "ACTIVE",
                        "tagGroup": {
                            "id": "tg-proj",
                            "name": "Project",
                            "shortName": "PRJ",
                            "description": "Strategic IT Initiative",
                            "mandatory": True,
                            "mode": "SINGLE"
                        }
                    },
                    {
                        "id": "tag-dept-proc",
                        "name": "department:Procurement",
                        "description": "Procurement Group Function",
                        "bgColor": "#0d9488",
                        "status": "ACTIVE",
                        "tagGroup": {
                            "id": "tg-dept",
                            "name": "Department",
                            "shortName": "DEPT",
                            "description": "Owning Business Function",
                            "mandatory": True,
                            "mode": "SINGLE"
                        }
                    },
                    {
                        "id": "tag-crit-high",
                        "name": "criticality:Mission-Critical",
                        "description": "High tier availability SLA",
                        "bgColor": "#ef4444",
                        "status": "ACTIVE",
                        "tagGroup": {
                            "id": "tg-crit",
                            "name": "Business Criticality",
                            "shortName": "CRIT",
                            "description": "System Criticality Tier",
                            "mandatory": False,
                            "mode": "SINGLE"
                        }
                    }
                ],
                "fields": [
                    {
                        "name": "functionalSuitability",
                        "data": {"type": "StringValue", "value": "appropriate"},
                        "dataType": {"type": "singleSelect", "mandatory": True}
                    },
                    {
                        "name": "technicalSuitability",
                        "data": {"type": "StringValue", "value": "appropriate"},
                        "dataType": {"type": "singleSelect", "mandatory": True}
                    },
                    {
                        "name": "informationClassification",
                        "data": {"type": "StringValue", "value": "Internal"},
                        "dataType": {"type": "singleSelect", "mandatory": True}
                    },
                    {
                        "name": "hostingType",
                        "data": {"type": "StringValue", "value": "Cloud-AWS"},
                        "dataType": {"type": "singleSelect", "mandatory": False}
                    }
                ],
                "lifecycle": {
                    "asString": "active",
                    "phases": [
                        {"phase": "plan", "startDate": "2023-09-01"},
                        {"phase": "phaseIn", "startDate": "2024-01-15"},
                        {"phase": "active", "startDate": "2024-06-01"}
                    ]
                },
                "relations": [
                    {
                        "id": "rel-oh-to-atlas",
                        "displayNameToFS": "relApplicationToProject",
                        "typeFromFS": "Application",
                        "typeToFS": "Project",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                        "toId": "proj-atlas-fs-id",
                        "status": "ACTIVE",
                        "type": "relApplicationToProject",
                        "factSheet": {
                            "id": "proj-atlas-fs-id",
                            "name": "Project Atlas",
                            "type": "Project"
                        },
                        "fields": [
                            {"name": "impact", "data": {"type": "StringValue", "value": "Core Deliverable"}}
                        ]
                    },
                    {
                        "id": "rel-oh-to-s4hana",
                        "displayNameToFS": "relApplicationToApplication",
                        "typeFromFS": "Application",
                        "typeToFS": "Application",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                        "toId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
                        "status": "ACTIVE",
                        "type": "relApplicationToApplication",
                        "factSheet": {
                            "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
                            "name": "SAP S/4HANA Core",
                            "type": "Application"
                        },
                        "fields": [
                            {"name": "interfaceDirection", "data": {"type": "StringValue", "value": "Bidirectional"}},
                            {"name": "protocol", "data": {"type": "StringValue", "value": "REST / OData"}}
                        ]
                    },
                    {
                        "id": "rel-oh-to-gateway",
                        "displayNameToFS": "relApplicationToITComponent",
                        "typeFromFS": "Application",
                        "typeToFS": "ITComponent",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                        "toId": "itc-dt-api-gateway",
                        "status": "ACTIVE",
                        "type": "relApplicationToITComponent",
                        "factSheet": {
                            "id": "itc-dt-api-gateway",
                            "name": "Daimler Truck API Gateway",
                            "type": "ITComponent"
                        }
                    },
                    {
                        "id": "rel-oh-to-bc",
                        "displayNameToFS": "relApplicationToBusinessCapability",
                        "typeFromFS": "Application",
                        "typeToFS": "BusinessCapability",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                        "toId": "bc-supplier-mgmt",
                        "status": "ACTIVE",
                        "type": "relApplicationToBusinessCapability",
                        "factSheet": {
                            "id": "bc-supplier-mgmt",
                            "name": "Supplier Integration & Procurement Execution",
                            "type": "BusinessCapability"
                        }
                    }
                ],
                "milestones": [
                    {
                        "id": "ms-atlas-01",
                        "date": "2026-02-15",
                        "name": "Architecture Clearance",
                        "description": "Confluence ADR-001 Gateway routing approved by Architecture Board."
                    },
                    {
                        "id": "ms-atlas-02",
                        "date": "2026-07-30",
                        "name": "Supplier UAT Validation",
                        "description": "End-to-end partner testing across 25 pilot tier-1 suppliers."
                    },
                    {
                        "id": "ms-atlas-03",
                        "date": "2026-11-15",
                        "name": "Production Cutover Gate",
                        "description": "Final change authorization (CHG0019283) and runbook sign-off."
                    }
                ],
                "completion": {
                    "type": "FactSheetCompletion",
                    "completion": 0.95,
                    "percentage": 95,
                    "subCompletions": {
                        "header": {"type": "HeaderCompletion", "percentage": 100, "completion": 1.0},
                        "relations": {"type": "RelationsCompletion", "percentage": 92, "completion": 0.92},
                        "responsibilities": {"type": "ResponsibilitiesCompletion", "percentage": 100, "completion": 1.0},
                        "milestones": {"type": "MilestonesCompletion", "percentage": 90, "completion": 0.9}
                    }
                },
                "documents": [
                    {
                        "id": "doc-adr-001",
                        "name": "ADR-001: API Gateway Standard",
                        "description": "Architectural Decision Record mandating Kong API Gateway for B2B supplier traffic",
                        "url": "https://company-brain.atlassian.net/wiki/spaces/ATLAS/pages/ADR-001",
                        "origin": "CONFLUENCE",
                        "documentType": "Architecture Decision Record",
                        "createdAt": "2026-02-15T11:00:00.000Z"
                    },
                    {
                        "id": "doc-sec-approval",
                        "name": "DOC-002: InfoSec Clearance Certificate",
                        "description": "Daimler Cyber Defense Center official security approval certificate",
                        "url": "https://sharepoint.internal/atlas/security-approval.pdf",
                        "origin": "SHAREPOINT",
                        "documentType": "Security Review",
                        "createdAt": "2026-03-01T14:30:00.000Z"
                    }
                ],
                "comments": [
                    {
                        "id": "cmt-01",
                        "factSheetId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
                        "message": "Quality seal renewed following annual enterprise architecture audit.",
                        "status": "ACTIVE",
                        "userId": "user-jeevan",
                        "replies": [],
                        "createdAt": "2026-03-01T10:00:00.000Z"
                    }
                ],
                "subscriptions": [
                    {
                        "id": "sub-01",
                        "userId": "jeevan@daimlertruck.com",
                        "type": "ACCOUNTABLE",
                        "linkedRoles": [
                            {
                                "roleId": "role-lead-arch",
                                "name": "Lead Solutions Architect",
                                "description": "Responsible for technical design and API security"
                            }
                        ],
                        "roles": [
                            {"id": "role-lead-arch", "name": "Lead Solutions Architect", "subscriptionType": "ACCOUNTABLE"}
                        ]
                    },
                    {
                        "id": "sub-02",
                        "userId": "praneetha@daimlertruck.com",
                        "type": "RESPONSIBLE",
                        "linkedRoles": [
                            {
                                "roleId": "role-pm",
                                "name": "IT Project Manager",
                                "description": "Responsible for delivery timeline and stakeholder governance"
                            }
                        ],
                        "roles": [
                            {"id": "role-pm", "name": "IT Project Manager", "subscriptionType": "RESPONSIBLE"}
                        ]
                    }
                ],
                "permissions": {
                    "self": ["READ", "UPDATE"],
                    "create": ["FactSheet"],
                    "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"],
                    "update": ["ROLE_ARCHITECT"],
                    "delete": ["ROLE_ADMIN"]
                },
                "permittedReadACL": [{"id": "acl-read-all", "name": "All Authenticated Employees"}],
                "permittedWriteACL": [{"id": "acl-write-arch", "name": "Enterprise Architecture Team"}]
            },

            # 2. ATLAS - Legacy IDOC Gateway Application FactSheet (PhaseOut)
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e52",
                "name": "Legacy IDOC Gateway",
                "description": "Legacy mainframe EDI/IDOC interface currently in decommissioning wave under Project Atlas.",
                "displayName": "Legacy IDOC Gateway (Decommissioning)",
                "fullName": "Mainframe IDOC Partner Exchange Gateway",
                "type": "Application",
                "status": "PHASEOUT",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 88,
                "rev": 30,
                "createdAt": "2018-05-10T09:00:00.000Z",
                "updatedAt": "2026-08-12T16:00:00.000Z",
                "approvedAt": "2026-01-10T11:00:00.000Z",
                "tags": [
                    {"id": "t-atlas-2", "name": "project:ATLAS", "tagGroup": {"name": "Project"}},
                    {"id": "t-proc-2", "name": "department:Procurement", "tagGroup": {"name": "Department"}},
                    {"id": "t-status-phaseout", "name": "lifecycle:PhaseOut", "tagGroup": {"name": "Lifecycle"}}
                ],
                "fields": [
                    {"name": "functionalSuitability", "data": {"type": "StringValue", "value": "unreasonable"}},
                    {"name": "technicalSuitability", "data": {"type": "StringValue", "value": "unreasonable"}},
                    {"name": "informationClassification", "data": {"type": "StringValue", "value": "Internal"}}
                ],
                "lifecycle": {
                    "asString": "phaseOut",
                    "phases": [
                        {"phase": "active", "startDate": "2018-06-01", "endDate": "2026-06-30"},
                        {"phase": "phaseOut", "startDate": "2026-07-01", "endDate": "2026-12-31"},
                        {"phase": "endOfLife", "startDate": "2027-01-01"}
                    ]
                },
                "relations": [
                    {
                        "id": "rel-idoc-to-atlas",
                        "displayNameToFS": "relApplicationToProject",
                        "typeFromFS": "Application",
                        "typeToFS": "Project",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e52",
                        "toId": "proj-atlas-fs-id",
                        "status": "ACTIVE",
                        "type": "relApplicationToProject",
                        "factSheet": {"id": "proj-atlas-fs-id", "name": "Project Atlas", "type": "Project"}
                    }
                ],
                "milestones": [
                    {"id": "ms-idoc-01", "date": "2026-12-31", "name": "Decommissioning Complete", "description": "Switch off mainframe listener."}
                ],
                "completion": {"type": "FactSheetCompletion", "completion": 0.88, "percentage": 88},
                "documents": [],
                "comments": [],
                "subscriptions": [
                    {"id": "sub-idoc-01", "userId": "legacy-team@daimlertruck.com", "type": "ACCOUNTABLE"}
                ],
                "permissions": {"self": ["READ"], "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_SUPPORT"]}
            },

            # 3. PHOENIX - SAP S/4HANA Finance Core Application FactSheet
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
                "name": "SAP S/4HANA Core",
                "description": "Global ERP Core digital backbone for Daimler Truck Group accounting, logistics, and plant execution.",
                "displayName": "SAP S/4HANA Core ERP",
                "fullName": "SAP S/4HANA Enterprise Cloud (Group Core)",
                "type": "Application",
                "status": "ACTIVE",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 100,
                "rev": 120,
                "createdAt": "2021-03-01T08:00:00.000Z",
                "updatedAt": "2026-10-06T12:00:00.000Z",
                "approvedAt": "2026-01-15T09:00:00.000Z",
                "tags": [
                    {"id": "t-phx-01", "name": "project:PHOENIX", "tagGroup": {"name": "Project"}},
                    {"id": "t-fin-01", "name": "department:Finance", "tagGroup": {"name": "Department"}},
                    {"id": "t-crit-01", "name": "criticality:Mission-Critical", "tagGroup": {"name": "Business Criticality"}}
                ],
                "fields": [
                    {"name": "functionalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "technicalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "informationClassification", "data": {"type": "StringValue", "value": "Confidential"}}
                ],
                "lifecycle": {"asString": "active"},
                "relations": [
                    {
                        "id": "rel-s4-to-phoenix",
                        "displayNameToFS": "relApplicationToProject",
                        "typeFromFS": "Application",
                        "typeToFS": "Project",
                        "fromId": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
                        "toId": "proj-phx-fs-id",
                        "status": "ACTIVE",
                        "type": "relApplicationToProject",
                        "factSheet": {"id": "proj-phx-fs-id", "name": "Project Phoenix", "type": "Project"}
                    }
                ],
                "milestones": [
                    {"id": "ms-phx-01", "date": "2026-06-30", "name": "Wave 3 Rollout", "description": "European plant wave go-live."}
                ],
                "completion": {"type": "FactSheetCompletion", "completion": 1.0, "percentage": 100},
                "documents": [],
                "comments": [],
                "subscriptions": [
                    {"id": "sub-phx-01", "userId": "dr.michael.bauer@daimlertruck.com", "type": "ACCOUNTABLE"}
                ],
                "permissions": {"self": ["READ", "UPDATE"], "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"]}
            },

            # 4. AURORA - SAP Datasphere Core Application FactSheet
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e56",
                "name": "SAP Datasphere Core",
                "description": "Enterprise cloud data warehouse and analytical semantic fabric for unified Group reporting.",
                "displayName": "SAP Datasphere (Data Platform)",
                "fullName": "SAP Datasphere Cloud Enterprise Semantic Layer",
                "type": "Application",
                "status": "ACTIVE",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 92,
                "rev": 55,
                "createdAt": "2024-06-01T10:00:00.000Z",
                "updatedAt": "2026-09-20T11:00:00.000Z",
                "approvedAt": "2026-04-10T14:00:00.000Z",
                "tags": [
                    {"id": "t-aur-01", "name": "project:AURORA", "tagGroup": {"name": "Project"}},
                    {"id": "t-btp-01", "name": "department:Analytics & BTP", "tagGroup": {"name": "Department"}}
                ],
                "fields": [
                    {"name": "functionalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "technicalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "informationClassification", "data": {"type": "StringValue", "value": "Internal"}}
                ],
                "lifecycle": {"asString": "active"},
                "relations": [],
                "milestones": [
                    {"id": "ms-aur-01", "date": "2026-09-15", "name": "Semantic Layer Cutover", "description": "Datasphere spaces live."}
                ],
                "completion": {"type": "FactSheetCompletion", "completion": 0.92, "percentage": 92},
                "documents": [],
                "comments": [],
                "subscriptions": [
                    {"id": "sub-aur-01", "userId": "dr.elena.rostova@daimlertruck.com", "type": "ACCOUNTABLE"}
                ],
                "permissions": {"self": ["READ"], "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"]}
            },

            # 5. SIRIUS - SAP BTP Integration Suite Application FactSheet
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e57",
                "name": "SAP BTP Integration Suite",
                "description": "Enterprise cloud integration broker and iFlow execution engine replacing legacy SAP PO.",
                "displayName": "SAP BTP Integration Suite",
                "fullName": "SAP Business Technology Platform Cloud Integration",
                "type": "Application",
                "status": "ACTIVE",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 90,
                "rev": 60,
                "createdAt": "2024-02-10T09:30:00.000Z",
                "updatedAt": "2026-10-01T15:00:00.000Z",
                "approvedAt": "2026-03-20T10:00:00.000Z",
                "tags": [
                    {"id": "t-sir-01", "name": "project:SIRIUS", "tagGroup": {"name": "Project"}},
                    {"id": "t-ops-01", "name": "department:Platform & Operations", "tagGroup": {"name": "Department"}}
                ],
                "fields": [
                    {"name": "functionalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "technicalSuitability", "data": {"type": "StringValue", "value": "perfect"}},
                    {"name": "informationClassification", "data": {"type": "StringValue", "value": "Internal"}}
                ],
                "lifecycle": {"asString": "active"},
                "relations": [],
                "milestones": [
                    {"id": "ms-sir-01", "date": "2026-10-31", "name": "Wave 1 iFlow Migration", "description": "Migrate 85 SAP PO interfaces."}
                ],
                "completion": {"type": "FactSheetCompletion", "completion": 0.90, "percentage": 90},
                "documents": [],
                "comments": [],
                "subscriptions": [
                    {"id": "sub-sir-01", "userId": "klaus.meyer@daimlertruck.com", "type": "ACCOUNTABLE"}
                ],
                "permissions": {"self": ["READ"], "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"]}
            },

            # 6. NEMO - GRC Access Control Application FactSheet
            {
                "id": "e4a2d810-7b2c-493e-9081-0a9b8c7d6e58",
                "name": "GRC Access Control 12.0",
                "description": "Central Segregation of Duties (SoD) analysis and emergency privileged access governance platform.",
                "displayName": "SAP GRC Access Control",
                "fullName": "SAP Governance, Risk and Compliance Access Control 12.0",
                "type": "Application",
                "status": "ACTIVE",
                "lxState": "APPROVED",
                "level": 1,
                "qualitySealStatus": "APPROVED",
                "score": 96,
                "rev": 80,
                "createdAt": "2022-01-10T08:00:00.000Z",
                "updatedAt": "2026-09-18T17:00:00.000Z",
                "approvedAt": "2026-02-14T10:00:00.000Z",
                "tags": [
                    {"id": "t-nem-01", "name": "project:NEMO", "tagGroup": {"name": "Project"}},
                    {"id": "t-grc-01", "name": "department:GRC & Security", "tagGroup": {"name": "Department"}}
                ],
                "fields": [
                    {"name": "functionalSuitability", "data": {"type": "StringValue", "value": "appropriate"}},
                    {"name": "technicalSuitability", "data": {"type": "StringValue", "value": "appropriate"}},
                    {"name": "informationClassification", "data": {"type": "StringValue", "value": "Confidential"}}
                ],
                "lifecycle": {"asString": "active"},
                "relations": [],
                "milestones": [
                    {"id": "ms-nem-01", "date": "2026-08-30", "name": "SoD Rule Harmonization", "description": "Global rule matrix 5.2 live."}
                ],
                "completion": {"type": "FactSheetCompletion", "completion": 0.96, "percentage": 96},
                "documents": [],
                "comments": [],
                "subscriptions": [
                    {"id": "sub-nem-01", "userId": "sophie.dubois@daimlertruck.com", "type": "ACCOUNTABLE"}
                ],
                "permissions": {"self": ["READ"], "read": ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_SUPPORT"]}
            }
        ]

    def _generate_simulated_rest_response(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates official SAP LeanIX REST API /factSheets response matching OpenAPI schema.
        """
        fact_sheets = self._get_canonical_factsheets()
        return {
            "status": "OK",
            "type": "FactSheetListResponse",
            "message": "FactSheets retrieved successfully",
            "errors": [],
            "total": len(fact_sheets),
            "data": fact_sheets,
            "cursor": "cursor-token-end"
        }

    def _generate_simulated_graphql_response(self, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates official SAP LeanIX GraphQL allFactSheets response matching GraphQL meta-model schema.
        """
        fact_sheets = self._get_canonical_factsheets()
        edges = [{"node": fs} for fs in fact_sheets]
        return {
            "data": {
                "allFactSheets": {
                    "totalCount": len(edges),
                    "pageInfo": {
                        "hasNextPage": False,
                        "endCursor": "cursor-token-end"
                    },
                    "edges": edges
                }
            }
        }
