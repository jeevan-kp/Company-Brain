"""
ServiceNow REST Table API Client
Supports live execution (GET https://{instance}.service-now.com/api/now/table/{tableName})
and authentic mock simulation matching the exact official ServiceNow Table API JSON envelope.
"""
import os
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)

class ServiceNowTableClient:
    def __init__(self, instance_url: Optional[str] = None, user: Optional[str] = None, password: Optional[str] = None):
        self.instance_url = instance_url or os.getenv("SERVICENOW_INSTANCE_URL")
        self.user = user or os.getenv("SERVICENOW_USER")
        self.password = password or os.getenv("SERVICENOW_PASSWORD")
        self.is_live = bool(self.instance_url and self.user and self.password)

    async def get_records(self, table_name: str, sysparm_query: Optional[str] = None) -> Dict[str, Any]:
        """Fetch records from a ServiceNow table (e.g. 'incident', 'change_request')."""
        if self.is_live:
            try:
                auth = (self.user, self.password)
                headers = {"Accept": "application/json"}
                params = {"sysparm_display_value": "true"}
                if sysparm_query:
                    params["sysparm_query"] = sysparm_query

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        f"{self.instance_url.rstrip('/')}/api/now/table/{table_name}",
                        auth=auth,
                        params=params,
                        headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                logger.warning(f"ServiceNow live API call failed, falling back to simulated payload: {e}")

        if table_name == "incident":
            return self._generate_simulated_incidents_response()
        elif table_name == "change_request":
            return self._generate_simulated_changes_response()
        return {"result": []}

    def _generate_simulated_incidents_response(self) -> Dict[str, Any]:
        """
        Generates realistic ServiceNow incident table response.
        Contains standard 'result' envelope with authentic incident dictionary fields.
        """
        incidents = [
            {
                "sys_id": "a79d926cdb234010e6e80d53ca9619fe",
                "number": "INC0042891",
                "short_description": "Supplier API authentication fails during supplier integration tests",
                "description": "Supplier endpoints intermittently return HTTP 401 Unauthorized when accessing Order Hub via token refresh mechanism.",
                "state": "1",  # 1 = New, 2 = In Progress
                "priority": "1",  # 1 = Critical
                "urgency": "1",
                "impact": "1",
                "cmdb_ci": {"display_value": "ORDER-HUB", "link": "https://service-now.com/api/now/table/cmdb_ci/app001"},
                "assignment_group": {"display_value": "Integration Platform Support"},
                "assigned_to": {"display_value": "developer_01"},
                "sys_created_on": "2026-10-04 09:15:32",
                "sys_updated_on": "2026-10-06 08:30:11",
                "sys_created_by": "supplier_gateway_monitor",
                "u_project_id": "ATLAS",
                "work_notes": "Identified as correlated with Jira defect ATL-6. Investigation ongoing."
            },
            {
                "sys_id": "b88e137ded345121f7f91e64db0720ab",
                "number": "INC0039482",
                "short_description": "Legacy IDOC gateway timeout on bulk message processing",
                "description": "EDI batch queue experienced backlog during night run.",
                "state": "6",  # 6 = Resolved
                "priority": "2",  # 2 = High
                "urgency": "2",
                "impact": "2",
                "cmdb_ci": {"display_value": "Legacy IDOC Gateway"},
                "assignment_group": {"display_value": "EDI Support"},
                "sys_created_on": "2026-09-25 03:00:15",
                "sys_updated_on": "2026-09-26 11:45:00",
                "close_code": "Solved (Workaround)",
                "close_notes": "Restarted EDI adapter queue. Scheduled for decommission under Project Atlas.",
                "u_project_id": "ATLAS"
            },
            {
                "sys_id": "c99f248efe456232a8a02f75ec1831bc",
                "number": "INC0041120",
                "short_description": "Datasphere cross-model join latency alert",
                "description": "Analytical query timeout on large sales reporting dataset.",
                "state": "2",
                "priority": "3",
                "cmdb_ci": {"display_value": "SAP Datasphere Core"},
                "assignment_group": {"display_value": "Analytics CoE"},
                "sys_created_on": "2026-10-02 14:20:00",
                "sys_updated_on": "2026-10-05 16:10:00",
                "u_project_id": "AURORA"
            }
        ]
        return {"result": incidents}

    def _generate_simulated_changes_response(self) -> Dict[str, Any]:
        """Generates realistic ServiceNow change_request table response."""
        changes = [
            {
                "sys_id": "d11a359fff567343b9b13a86fd2942cd",
                "number": "CHG0019283",
                "short_description": "Deploy Atlas Supplier Integration API Gateway v1.2.0 to Production",
                "description": "Production rollout of modernized supplier API gateway routing and OAuth policies.",
                "type": "Normal",
                "state": "Approved",
                "approval": "approved",
                "risk": "Moderate",
                "cmdb_ci": {"display_value": "ORDER-HUB"},
                "requested_by": {"display_value": "Praneetha"},
                "assigned_to": {"display_value": "Jeevan"},
                "start_date": "2026-10-20 22:00:00",
                "end_date": "2026-10-21 02:00:00",
                "u_project_id": "ATLAS",
                "backout_plan": "Restore legacy routing via IDOC Gateway using Runbook DOC-005."
            },
            {
                "sys_id": "e22b460aaa678454cac24b97ae3053de",
                "number": "CHG0018540",
                "short_description": "Database schema migration for Order Hub entity store",
                "type": "Standard",
                "state": "Implemented",
                "approval": "approved",
                "risk": "Low",
                "cmdb_ci": {"display_value": "ORDER-HUB"},
                "u_project_id": "ATLAS"
            }
        ]
        return {"result": changes}
