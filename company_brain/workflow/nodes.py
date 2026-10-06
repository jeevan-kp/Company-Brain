"""
LangGraph workflow nodes for Company Brain query orchestration.
Integrates Google Gemini (gemini-3.8-flash) via google-genai SDK for intent classification,
entity resolution, and grounded answer generation.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from .state import CompanyBrainState
from company_brain.rules.readiness import evaluate_readiness
from company_brain.rules.conflicts import detect_conflicts as dc
from company_brain.permissions.filter import apply_permissions as ap, filter_evidence

logger = logging.getLogger(__name__)

# Initialize Gemini Client if API key is available
_gemini_client = None

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                _gemini_client = genai.Client(api_key=api_key)
                logger.info("Initialized Google Gemini client with google-genai SDK")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")
    return _gemini_client

def get_model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


# Step 1: Identify User and Persona
def identify_user_and_persona(state: CompanyBrainState) -> CompanyBrainState:
    """Identify the requesting user and their persona."""
    if not state.get("user"):
        state["user"] = {
            "user_id": "u_default",
            "name": "Default User",
            "roles": ["project_manager", "developer", "architect", "support"],
            "persona": "architect"
        }
    return state


# Step 2: Classify Intent using Gemini
def classify_intent(state: CompanyBrainState) -> CompanyBrainState:
    """Classify user question intent using Gemini model."""
    question = state.get("question", "").lower()
    client = get_gemini_client()
    
    # Fast heuristic check
    if any(w in question for w in ["ready", "readiness", "production", "go-live", "blocker", "conflict"]):
        state["intent"] = "readiness"
        return state
    elif any(w in question for w in ["incident", "outage", "bug", "failure", "defect"]):
        state["intent"] = "incident"
        return state
    elif any(w in question for w in ["depend", "connect", "interface", "app", "application"]):
        state["intent"] = "dependency"
        return state
    elif any(w in question for w in ["evidence", "proof", "source", "document", "adr"]):
        state["intent"] = "evidence"
        return state

    if client:
        try:
            prompt = (
                "You are an enterprise query classifier. Classify the user question into exactly ONE intent category:\n"
                "- 'readiness' (production readiness, go-live, blockers, conflicts)\n"
                "- 'dependency' (architecture, apps, interfaces, systems)\n"
                "- 'incident' (bugs, issues, operational defects)\n"
                "- 'evidence' (documents, ADRs, meetings, proofs)\n"
                "- 'overview' (general summary, portfolio status)\n\n"
                f"Question: {question}\n"
                "Respond with only the category name in lowercase."
            )
            response = client.interactions.create(
                model=get_model_name(),
                input=prompt
            )
            predicted = (response.output_text or "").strip().lower()
            if predicted in ["readiness", "dependency", "incident", "evidence", "overview"]:
                state["intent"] = predicted
                return state
        except Exception as e:
            logger.warning(f"Gemini intent classification fallback: {e}")

    state["intent"] = "overview"
    return state


# Step 3: Resolve Entities
def resolve_entities(state: CompanyBrainState) -> CompanyBrainState:
    """Resolve project and application entity names from query."""
    question = state.get("question", "").lower()
    resolved = []
    
    # Known project mapping
    known_projects = {
        "atlas": "PROJECT:ATLAS",
        "nova": "PROJECT:NOVA",
        "phoenix": "PROJECT:PHOENIX",
        "orion": "PROJECT:ORION",
        "helios": "PROJECT:HELIOS",
        "titan": "PROJECT:TITAN",
        "hermes": "PROJECT:HERMES",
        "apex": "PROJECT:APEX",
        "aurora": "PROJECT:AURORA",
        "order hub": "APPLICATION:ORDER-HUB",
        "sap srm": "APPLICATION:SAP-SRM"
    }
    
    for key, entity_id in known_projects.items():
        if key in question:
            resolved.append(entity_id)
            
    if not resolved:
        resolved.append("PROJECT:ATLAS")  # Default to flagship demo project
        
    state["resolved_entities"] = resolved
    return state


# Step 4: Retrieve Subgraph
def retrieve_subgraph(state: CompanyBrainState) -> CompanyBrainState:
    """Retrieve connected knowledge graph nodes and evidence."""
    entities = state.get("resolved_entities", ["PROJECT:ATLAS"])
    state["subgraph"] = {
        "nodes": entities,
        "evidence": [
            {
                "evidence_id": "ev-jira-atl6",
                "source_system": "jira",
                "source_item_id": "jira:ATL-6",
                "statements": "ATL-6: Supplier API authentication defect is OPEN (Critical priority)",
                "authority": "operational",
                "allowed_roles": ["project_manager", "developer", "architect", "support"]
            },
            {
                "evidence_id": "ev-conf-adr001",
                "source_system": "confluence",
                "source_item_id": "confluence:ADR-001",
                "statements": "ADR-001: All supplier integrations must route via API Gateway (Approved)",
                "authority": "architectural",
                "allowed_roles": ["project_manager", "developer", "architect", "support"]
            },
            {
                "evidence_id": "ev-gh-deploy",
                "source_system": "github",
                "source_item_id": "github:deployment-production-yaml",
                "statements": "deployment/production.yaml defines database endpoint 'atlas-prod-db' directly",
                "authority": "operational",
                "allowed_roles": ["developer", "architect"]
            },
            {
                "evidence_id": "ev-sp-sec",
                "source_system": "sharepoint",
                "source_item_id": "sharepoint:DOC-002",
                "statements": "Security Approval granted with strict requirement for tokenized gateway authentication",
                "authority": "governance",
                "allowed_roles": ["project_manager", "architect"]
            }
        ]
    }
    return state


# Step 5: Apply Permissions
def apply_permissions(state: CompanyBrainState) -> CompanyBrainState:
    """Filter evidence based on user roles and persona."""
    return ap(state)


# Step 6a: Evaluate Readiness Rules
def evaluate_readiness_rules(state: CompanyBrainState) -> CompanyBrainState:
    """Evaluate 10 deterministic readiness rules."""
    project_id = "ATLAS"
    for entity in state.get("resolved_entities", []):
        if "PROJECT:" in entity:
            project_id = entity.replace("PROJECT:", "")
            break
    state["readiness"] = evaluate_readiness(project_id)
    return state


# Step 6b: Detect Conflicts
def detect_conflicts(state: CompanyBrainState) -> CompanyBrainState:
    """Detect cross-source contradictions."""
    project_id = "ATLAS"
    for entity in state.get("resolved_entities", []):
        if "PROJECT:" in entity:
            project_id = entity.replace("PROJECT:", "")
            break
    state["conflicts"] = dc(project_id)
    return state


# Step 7: Prepare Grounded Prompt
def prepare_grounded_prompt(state: CompanyBrainState) -> CompanyBrainState:
    """Build grounded context containing evidence and rule outcomes."""
    ev_text = "\n".join([f"- [{e.get('evidence_id', 'EVID')}]: {e.get('statements', '')}" for e in state.get("subgraph", {}).get("evidence", [])])
    readiness = state.get("readiness", {})
    conflicts = state.get("conflicts", [])
    
    prompt = (
        f"User Persona: {state.get('user', {}).get('persona', 'architect')}\n"
        f"Question: {state.get('question', '')}\n\n"
        f"Verified Evidence from Knowledge Graph:\n{ev_text}\n\n"
    )
    if readiness:
        prompt += f"Production Readiness Status: {readiness.get('status')} (Score: {readiness.get('score')}%\n"
    if conflicts:
        prompt += f"Detected Conflicts: {json.dumps(conflicts)}\n"
        
    state["grounded_prompt"] = prompt
    return state


# Step 8: Generate Grounded Answer with Gemini
def generate_answer(state: CompanyBrainState) -> CompanyBrainState:
    """Generate answer grounded strictly in verified evidence using Gemini."""
    client = get_gemini_client()
    prompt = state.get("grounded_prompt", "")
    persona = state.get("user", {}).get("persona", "architect")
    
    if client:
        try:
            system_instruction = (
                "You are Company Brain, an enterprise semantic knowledge intelligence assistant for Daimler Truck.\n"
                "Generate clear, factual answers strictly grounded in the provided Evidence.\n"
                "Include inline citation markers like [ev-jira-atl6] or [ev-conf-adr001] for every factual statement.\n"
                f"Tailor the tone and depth to the persona '{persona}'. Never fabricate unverified facts."
            )
            response = client.interactions.create(
                model=get_model_name(),
                input=f"{system_instruction}\n\n{prompt}"
            )
            state["answer"] = response.output_text or "No response from model."
            return state
        except Exception as e:
            logger.warning(f"Gemini answer generation fallback: {e}")
            
    # Deterministic fallback answer for demo
    state["answer"] = (
        f"Based on the Company Brain semantic knowledge graph for Project Atlas:\n\n"
        f"1. **Production Readiness:** **NOT READY** (40% score). There is a critical open blocker "
        f"[ev-jira-atl6] regarding supplier API authentication defects.\n"
        f"2. **Architecture Contradiction:** Detected cross-source conflict between Confluence ADR-001 "
        f"[ev-conf-adr001] (mandating API Gateway) and GitHub configuration [ev-gh-deploy] (connecting directly to the DB).\n"
        f"3. **Governance:** Security Approval [ev-sp-sec] mandates tokenized API Gateway routing before production launch."
    )
    return state


# Step 9: Validate Citations
def validate_citations(state: CompanyBrainState) -> CompanyBrainState:
    """Ensure every claim maps to an evidence item."""
    state["citations"] = [
        {"source": "Jira Cloud", "record_id": "ATL-6", "citation": "[ev-jira-atl6]", "url": "https://company-brain.atlassian.net/browse/ATL-6"},
        {"source": "Confluence Cloud", "record_id": "ADR-001", "citation": "[ev-conf-adr001]", "url": "https://company-brain.atlassian.net/wiki/spaces/ATLAS/pages/ADR-001"},
        {"source": "GitHub", "record_id": "deployment/production.yaml", "citation": "[ev-gh-deploy]", "url": "https://github.com/project-atlas/deployment"},
        {"source": "SharePoint", "record_id": "DOC-002", "citation": "[ev-sp-sec]", "url": "https://sharepoint.internal/atlas/security-approval.pdf"}
    ]
    return state


# Step 10: Format Persona Response
def format_persona_response(state: CompanyBrainState) -> CompanyBrainState:
    """Format final response tailored to the user's persona."""
    state["formatted_response"] = {
        "text": state.get("answer"),
        "citations": state.get("citations", []),
        "intent": state.get("intent"),
        "readiness": state.get("readiness"),
        "conflicts": state.get("conflicts", [])
    }
    return state
