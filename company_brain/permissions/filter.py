from typing import List, Dict, Any, Optional

PERSONAS = {
    "Management": ["read_all_summary"],
    "Project Manager": ["read_project", "read_readiness"],
    "Developer": ["read_code", "read_jira"],
    "Support/Operations": ["read_incident", "read_metrics"],
    "Architect": ["read_architecture", "read_code"]
}

PERSONA_CONFIGS = {
    "management": {
        "sees": ["business_objective", "overall_status", "blockers", "risk", "decisions_required"],
        "hides": ["git_commits", "dev_discussions", "raw_configs"]
    },
    "project_manager": {
        "sees": ["milestones", "blockers", "approvals", "owners", "actions", "risks"],
        "hides": ["low_level_infra"]
    },
    "developer": {
        "sees": ["jira_stories", "adrs", "github", "interfaces", "incidents"],
        "hides": ["restricted_governance_docs"]
    },
    "support": {
        "sees": ["applications", "interfaces", "runbooks", "incidents", "changes", "monitoring_owner"],
        "hides": ["developer_chat"]
    },
    "architect": {
        "sees": ["all_above", "full_decision_log", "conflicts", "dependencies"],
        "hides": []
    }
}

def get_persona_config(persona: str) -> Dict[str, Any]:
    """Return persona visibility configuration."""
    return PERSONA_CONFIGS.get(persona.lower(), PERSONA_CONFIGS["architect"])

def filter_evidence(evidence_list: List[Dict[str, Any]], user_roles: List[str]) -> List[Dict[str, Any]]:
    """Filter evidence list based on user roles, masking restricted items without revealing content."""
    filtered = []
    for item in evidence_list:
        allowed_roles = item.get("allowed_roles", [])
        if not allowed_roles or any(role in allowed_roles for role in user_roles):
            filtered.append(item)
        else:
            filtered.append({
                "evidence_id": item.get("evidence_id") or item.get("id"),
                "restricted": True,
                "restricted_message": "A security assessment exists for this project, but the underlying document is not available under your current access. Please contact the Security team.",
                "authority": item.get("authority", "governance")
            })
    return filtered

def apply_permissions(state: Dict[str, Any]) -> Dict[str, Any]:
    user = state.get("user", {})
    roles = user.get("roles", [])
    
    if "subgraph" in state and "evidence" in state["subgraph"]:
        state["subgraph"]["evidence"] = filter_evidence(state["subgraph"]["evidence"], roles)
        
    state["permissions_applied"] = True
    return state
