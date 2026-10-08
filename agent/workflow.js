// ============================================================================
// agent/workflow.js — LangGraph Agent StateGraph Orchestrator (Team 20)
// ============================================================================
const { StateGraph, END, START } = require('@langchain/langgraph');
const { identifyUserAndIntent } = require('./nodes/identifyUserAndIntent');
const { resolveEntities } = require('./nodes/resolveEntities');
const { retrieve } = require('./nodes/retrieve');
const { applyPermissions } = require('./nodes/applyPermissions');
const { readinessAndConflictRules } = require('./nodes/readinessAndConflictRules');
const { generateAnswer } = require('./nodes/generateAnswer');
const { validateCitations } = require('./nodes/validateCitations');

// 1. Define State Schema Annotation
const stateAnnotation = {
    query: { value: (x, y) => (y !== undefined ? y : x), default: () => '' },
    userRole: { value: (x, y) => (y !== undefined ? y : x), default: () => 'Developer' },
    personId: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
    intent: { value: (x, y) => (y !== undefined ? y : x), default: () => 'general' },
    intentSource: { value: (x, y) => (y !== undefined ? y : x), default: () => 'default' },
    resolvedEntities: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    projectIds: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    graphFacts: { value: (x, y) => (y !== undefined ? y : x), default: () => ({}) },
    impactData: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    retrievedChunks: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    detectedAnomalies: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    readinessFindings: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
    answer: { value: (x, y) => (y !== undefined ? y : x), default: () => '' },
    citations: { value: (x, y) => (y !== undefined ? y : x), default: () => ({}) },
    timings: { value: (x, y) => ({ ...(x || {}), ...(y || {}) }), default: () => ({}) }
};

// 2. Build StateGraph Pipeline
const workflow = new StateGraph({
    channels: stateAnnotation
})
    .addNode('identify_user_and_intent', identifyUserAndIntent)
    .addNode('resolve_entities', resolveEntities)
    .addNode('retrieve', retrieve)
    .addNode('apply_permissions', applyPermissions)
    .addNode('readiness_and_conflict_rules', readinessAndConflictRules)
    .addNode('generate_answer', generateAnswer)
    .addNode('validate_citations', validateCitations)

    // Wire sequential edges
    .addEdge(START, 'identify_user_and_intent')
    .addEdge('identify_user_and_intent', 'resolve_entities')
    .addEdge('resolve_entities', 'retrieve')
    .addEdge('retrieve', 'apply_permissions')
    .addEdge('apply_permissions', 'readiness_and_conflict_rules')
    .addEdge('readiness_and_conflict_rules', 'generate_answer')
    .addEdge('generate_answer', 'validate_citations')
    .addEdge('validate_citations', END);

// Compile the executable application graph
const agentApp = workflow.compile();

/**
 * Executes the full agent pipeline for a query.
 */
async function runAgentQuery({ query, userRole = 'Developer', personId = null }) {
    const totalStart = Date.now();
    const initialState = {
        query,
        userRole,
        personId,
        timings: { total_start: totalStart }
    };

    const finalState = await agentApp.invoke(initialState);
    finalState.timings.total_duration = Date.now() - totalStart;

    return finalState;
}

module.exports = {
    agentApp,
    runAgentQuery
};
