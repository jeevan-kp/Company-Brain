from typing import List, Dict, Any

def detect_conflicts(project_id: str, graph: Any = None) -> List[Dict[str, Any]]:
    # 3 conflict detection patterns:
    # 1. Architecture vs Implementation
    # 2. Approved decision vs discussion
    # 3. Documented readiness vs actual
    conflicts = []
    
    # Mock implementations for conflicts
    conflicts.append({
        "conflict_type": "Architecture vs Implementation",
        "description": "Confluence ADR says 'API Gateway', GitHub deployment.yaml says 'direct_database'",
        "evidence_a": "adr_123",
        "evidence_b": "github_456",
        "severity": "critical",
        "recommended_action": "Align implementation with ADR or update ADR"
    })
    
    conflicts.append({
        "conflict_type": "Approved decision vs discussion",
        "description": "Meeting decision = 'approved API Gateway only', Teams message admits 'temporary direct DB'",
        "evidence_a": "meeting_789",
        "evidence_b": "teams_101",
        "severity": "warning",
        "recommended_action": "Clarify decision in Teams"
    })
    
    conflicts.append({
        "conflict_type": "Documented readiness vs actual",
        "description": "SharePoint checklist says 'auth defect resolved', Jira ATL-6 still OPEN",
        "evidence_a": "sp_202",
        "evidence_b": "jira_atl_6",
        "severity": "critical",
        "recommended_action": "Resolve Jira issue ATL-6 or update SharePoint checklist"
    })
    
    return conflicts
