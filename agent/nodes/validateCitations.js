// ============================================================================
// agent/nodes/validateCitations.js — Node 7: Non-LLM Citation Validation
// ============================================================================

async function validateCitations(state) {
    const startTime = Date.now();
    const { answer, graphFacts, retrievedChunks, detectedAnomalies, userRole } = state;

    // Collect all valid evidence IDs present in context
    const validEvidenceIds = new Set();

    // 1. Projects
    if (graphFacts) {
        Object.keys(graphFacts).forEach(pid => {
            validEvidenceIds.add(pid);
            validEvidenceIds.add(`project:${pid}`);
        });
    }

    // 2. Chunks & Documents
    if (retrievedChunks) {
        retrievedChunks.forEach(c => {
            if (c.project_id) validEvidenceIds.add(c.project_id);
            if (c.title) validEvidenceIds.add(c.title);
            if (c.doc_type) validEvidenceIds.add(`${c.doc_type}-${c.project_id}`);
        });
    }

    // 3. Anomalies
    if (detectedAnomalies) {
        detectedAnomalies.forEach(a => validEvidenceIds.add(a.id));
    }

    // Extract citations from answer text using regex: [ID]
    const citationRegex = /\[([A-Za-z0-9_\-:]+)\]/g;
    const citedIds = [];
    let match;

    while ((match = citationRegex.exec(answer || '')) !== null) {
        citedIds.push(match[1]);
    }

    // Verify citations
    const verifiedCitations = [];
    const unverifiedCitations = [];

    for (const id of citedIds) {
        if (validEvidenceIds.has(id) || Array.from(validEvidenceIds).some(v => v.includes(id) || id.includes(v))) {
            verifiedCitations.push(id);
        } else {
            unverifiedCitations.push(id);
        }
    }

    const citationPrecision = citedIds.length > 0 
        ? (verifiedCitations.length / citedIds.length) 
        : 1.0;

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, validate_citations: duration };

    return {
        ...state,
        citations: {
            cited: citedIds,
            verified: verifiedCitations,
            unverified: unverifiedCitations,
            precision: citationPrecision
        },
        timings
    };
}

module.exports = { validateCitations };
