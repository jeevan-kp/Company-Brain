from typing import TypedDict, List, Dict, Any

class CompanyBrainState(TypedDict):
    user: Dict[str, Any]          # {user_id, name, roles, persona}
    question: str
    intent: str                   # overview / readiness / dependency / incident / evidence
    resolved_entities: List[str]
    subgraph: Dict[str, Any]
    permissions_applied: bool
    readiness: Dict[str, Any]     # if intent is readiness
    conflicts: List[Dict[str, Any]] # if intent is readiness
    grounded_prompt: str
    answer: str
    citations: List[str]
    formatted_response: Dict[str, Any]
