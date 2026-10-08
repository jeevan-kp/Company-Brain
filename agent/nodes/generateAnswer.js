// ============================================================================
// agent/nodes/generateAnswer.js — Node 6: Compact Prompt & Answer Generation
// ============================================================================
const { callChatLLM } = require('../llm');

function buildPrompt({ query, userRole, intent, graphFacts, impactData, retrievedChunks, detectedAnomalies }) {
    let contextBlock = '';

    // 1. Structured Graph Facts
    if (graphFacts && Object.keys(graphFacts).length > 0) {
        contextBlock += `### Enterprise Knowledge Graph Context:\n${JSON.stringify(graphFacts, null, 2)}\n\n`;
    }

    // 2. Impact Chain Data
    if (impactData && impactData.length > 0) {
        contextBlock += `### Service/Project Outage Impact Chain:\n${JSON.stringify(impactData, null, 2)}\n\n`;
    }

    // 3. Planted Anomalies / Conflicts
    if (detectedAnomalies && detectedAnomalies.length > 0) {
        contextBlock += `### Detected System Conflicts & Anomalies:\n${JSON.stringify(detectedAnomalies, null, 2)}\n\n`;
    }

    // 4. Evidence Document Chunks (Max 8)
    if (retrievedChunks && retrievedChunks.length > 0) {
        contextBlock += `### Retrieved Enterprise Document Excerpts (Max 8 Chunks):\n`;
        retrievedChunks.slice(0, 8).forEach((c, idx) => {
            contextBlock += `[Evidence #${idx + 1} | Title: ${c.title || c.chunk_id} | Source: ${c.source_system}]\n${c.chunk_text}\n\n`;
        });
    }

    const systemPrompt = `You are "Company Brain", an autonomous enterprise intelligence assistant for AutoNova Group (automotive company).
You answer user questions using ONLY the provided verified context.
User Role: ${userRole} | Query Intent: ${intent}

FORMATTING & ANSWER RULES:
1. Ground every claim directly in the provided context. If a fact is missing, state clearly that enterprise records do not contain this information.
2. CITATIONS: Cite the exact document title or entity in square brackets (e.g. [P-CYB-01], [SharePoint: Operational Runbook], [Confluence: ADR-001], [ServiceNow: INC0042891]).
3. Structure your response with clean markdown headers and bullet points.
4. Do NOT output raw debugging tags like "**Reasoning Trail:**", "INTENT:", or "Context:".
5. PERMISSIONS: Respect the user role (${userRole}). If budget details are marked RESTRICTED_BY_ROLE, state that financial budget information is restricted to Management and PMs.`;

    return {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${contextBlock}\n\nUser Question: ${query}` }
        ]
    };
}

async function generateAnswer(state, options = {}) {
    const startTime = Date.now();
    const promptPayload = buildPrompt(state);

    let answerText = '';
    let streamHandler = null;

    if (options.stream) {
        streamHandler = await callChatLLM({
            messages: promptPayload.messages,
            stream: true,
            temperature: 0.1
        });
    } else {
        const response = await callChatLLM({
            messages: promptPayload.messages,
            stream: false,
            temperature: 0.1
        });
        answerText = response.content;
    }

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, generate_answer: duration };

    return {
        ...state,
        answer: answerText,
        streamHandler,
        timings
    };
}

module.exports = {
    generateAnswer,
    buildPrompt
};
