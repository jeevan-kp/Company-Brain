// ============================================================================
// agent/nodes/identifyUserAndIntent.js — Node 1: Role & Intent Identification
// ============================================================================
const { classifyIntent } = require('../intentClassifier');

const VALID_ROLES = ['Management', 'PM', 'Developer', 'Support', 'Architect'];

async function identifyUserAndIntent(state) {
    const startTime = Date.now();

    // 1. Resolve User Role from headers/state
    let role = state.userRole || 'Developer';
    if (!VALID_ROLES.includes(role)) {
        role = 'Developer';
    }

    // 2. Classify Intent (Rule-first, fast LLM fallback)
    const { intent, source } = await classifyIntent(state.query);

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, identify_user_and_intent: duration };

    return {
        ...state,
        userRole: role,
        intent,
        intentSource: source,
        timings
    };
}

module.exports = { identifyUserAndIntent };
