// ============================================================================
// agent/intentClassifier.js — Rule-First Intent Classifier with Fast LLM Fallback
// ============================================================================
const { callFastLLM } = require('./llm');

const INTENTS = [
    'lookup',
    'impact_analysis',
    'people_and_ownership',
    'budget_and_cost',
    'how_to_resolve',
    'code_insight',
    'readiness_check',
    'conflict_check',
    'general'
];

/**
 * Fast regex and rule-based classifier (sub-millisecond execution).
 */
function classifyByRules(query) {
    const q = query.toLowerCase();

    // 1. Impact Analysis
    if (q.includes('impact') || q.includes('outage') || q.includes('affected') || q.includes('break') || q.includes('down') || q.includes('failover') || q.includes('if sap') || q.includes('if aks')) {
        return 'impact_analysis';
    }

    // 2. How to Resolve / Runbooks
    if (q.includes('how to') || q.includes('how do i') || q.includes('remediate') || q.includes('symptom') || q.includes('runbook') || q.includes('sop') || q.includes('triage') || q.includes('procedure') || q.includes('step-by-step') || q.includes('troubleshoot')) {
        return 'how_to_resolve';
    }

    // 3. Conflict / Anomaly Check
    if (q.includes('conflict') || q.includes('mismatch') || q.includes('contradict') || q.includes('divergence') || q.includes('anomaly') || q.includes('discrepancy') || q.includes('differ') || q.includes('drift')) {
        return 'conflict_check';
    }

    // 4. Operational Readiness Check
    if (q.includes('readiness') || q.includes('dr test') || q.includes('dr drill') || q.includes('scorecard') || q.includes('operational health') || q.includes('disaster recovery')) {
        return 'readiness_check';
    }

    // 5. Budget & Cost
    if (q.includes('budget') || q.includes('capex') || q.includes('opex') || q.includes('cost center') || q.includes('variance') || q.includes('spend') || q.includes('euro') || q.includes('€') || q.includes('fund')) {
        return 'budget_and_cost';
    }

    // 6. Code & Repositories & Vulnerabilities
    if (q.includes('repo') || q.includes('github') || q.includes('commit') || q.includes('pull request') || q.includes('pr ') || q.includes('cve') || q.includes('vulnerab') || q.includes('package') || q.includes('dependency') || q.includes('dockerfile')) {
        return 'code_insight';
    }

    // 7. People & Ownership
    if (q.includes('who is') || q.includes('who are') || q.includes('owner') || q.includes('tech lead') || q.includes('raci') || q.includes('accountable') || q.includes('responsible') || q.includes('team lead') || q.includes('who works on') || q.includes('contact')) {
        return 'people_and_ownership';
    }

    // 8. General Lookup
    if (q.includes('what is') || q.includes('which service') || q.includes('services used') || q.includes('platform') || q.includes('description') || q.includes('initiative') || q.includes('status of')) {
        return 'lookup';
    }

    return null; // Ambiguous, fallback to Fast LLM
}

/**
 * Classifies the user's intent.
 */
async function classifyIntent(query) {
    const ruleResult = classifyByRules(query);
    if (ruleResult) {
        return { intent: ruleResult, source: 'rule_engine' };
    }

    // Fallback: FAST deployment call
    try {
        const prompt = `Classify this automotive enterprise IT query into exactly one of: [lookup, impact_analysis, people_and_ownership, budget_and_cost, how_to_resolve, code_insight, readiness_check, conflict_check, general].
Query: "${query}"
Return only the intent label.`;

        const response = await callFastLLM({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.0,
            maxTokens: 20
        });

        const cleaned = response.trim().toLowerCase().replace(/[^a-z_]/g, '');
        if (INTENTS.includes(cleaned)) {
            return { intent: cleaned, source: 'fast_llm' };
        }
    } catch (err) {
        console.warn('Fast LLM intent classification failed, defaulting to general:', err.message);
    }

    return { intent: 'general', source: 'default' };
}

module.exports = {
    classifyIntent,
    classifyByRules,
    INTENTS
};
