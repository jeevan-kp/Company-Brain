from langgraph.graph import StateGraph, END
from .state import CompanyBrainState
from .nodes import (
    identify_user_and_persona, classify_intent, resolve_entities,
    retrieve_subgraph, apply_permissions, evaluate_readiness_rules,
    detect_conflicts, prepare_grounded_prompt, generate_answer,
    validate_citations, format_persona_response
)

def route_intent(state: CompanyBrainState) -> str:
    if state.get("intent") in ["readiness", "overview"]:
        return "evaluate_readiness_rules"
    return "prepare_grounded_prompt"

def build_graph():
    workflow = StateGraph(CompanyBrainState)
    
    workflow.add_node("identify_user_and_persona", identify_user_and_persona)
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node("resolve_entities", resolve_entities)
    workflow.add_node("retrieve_subgraph", retrieve_subgraph)
    workflow.add_node("apply_permissions", apply_permissions)
    
    workflow.add_node("evaluate_readiness_rules", evaluate_readiness_rules)
    workflow.add_node("detect_conflicts", detect_conflicts)
    
    workflow.add_node("prepare_grounded_prompt", prepare_grounded_prompt)
    workflow.add_node("generate_answer", generate_answer)
    workflow.add_node("validate_citations", validate_citations)
    workflow.add_node("format_persona_response", format_persona_response)
    
    workflow.set_entry_point("identify_user_and_persona")
    
    workflow.add_edge("identify_user_and_persona", "classify_intent")
    workflow.add_edge("classify_intent", "resolve_entities")
    workflow.add_edge("resolve_entities", "retrieve_subgraph")
    workflow.add_edge("retrieve_subgraph", "apply_permissions")
    
    workflow.add_conditional_edges("apply_permissions", route_intent, {
        "evaluate_readiness_rules": "evaluate_readiness_rules",
        "prepare_grounded_prompt": "prepare_grounded_prompt"
    })
    
    workflow.add_edge("evaluate_readiness_rules", "detect_conflicts")
    workflow.add_edge("detect_conflicts", "prepare_grounded_prompt")
    
    workflow.add_edge("prepare_grounded_prompt", "generate_answer")
    workflow.add_edge("generate_answer", "validate_citations")
    workflow.add_edge("validate_citations", "format_persona_response")
    workflow.add_edge("format_persona_response", END)
    
    return workflow.compile()

graph = build_graph()

def answer_question(user: dict, question: str) -> dict:
    state = CompanyBrainState(
        user=user,
        question=question,
        intent="",
        resolved_entities=[],
        subgraph={},
        permissions_applied=False,
        readiness={},
        conflicts=[],
        grounded_prompt="",
        answer="",
        citations=[],
        formatted_response={}
    )
    result = graph.invoke(state)
    return result.get("formatted_response", {})
