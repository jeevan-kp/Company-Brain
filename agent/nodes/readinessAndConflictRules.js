// ============================================================================
// agent/nodes/readinessAndConflictRules.js — Node 5: Governance & Conflict Checks
// ============================================================================
const { pool } = require('../../scripts/loaders/db_pool');
const { dbSemaphore } = require('../semaphore');
const { ANOMALIES } = require('../../server/src/services/projectsData');

async function readinessAndConflictRules(state) {
    const startTime = Date.now();
    const { projectIds, intent, query } = state;
    const anomalies = [];
    const readinessFindings = [];
    const qLower = (query || '').toLowerCase();

    // Check if query is asking about conflicts, readiness, or outages
    const isConflictQuery = qLower.includes('conflict') || qLower.includes('discrepancy') || qLower.includes('mismatch') || qLower.includes('remediat') || qLower.includes('anomal');
    const isReadinessQuery = qLower.includes('readiness') || qLower.includes('health') || qLower.includes('gate') || qLower.includes('score');

    try {
        if (projectIds.length > 0 || isConflictQuery || isReadinessQuery) {
            // First check canonical in-memory ANOMALIES dataset
            for (const a of ANOMALIES) {
                const matchProj = projectIds.includes(a.project_id);
                const matchQuery = qLower.includes(a.project_id.toLowerCase()) || 
                                   (qLower.includes('truck leasing') && a.project_id === 'P-DTFS-01') ||
                                   (qLower.includes('s/4hana') && a.project_id === 'P-FIN-01');
                
                if (matchProj || (isConflictQuery && matchQuery)) {
                    if (!anomalies.some(item => item.id === a.id)) {
                        anomalies.push({
                            id: a.id,
                            project_id: a.project_id,
                            type: a.type,
                            sources: a.sources,
                            severity: a.severity,
                            description: a.description,
                            detection_method: a.detection_method,
                            impact: a.impact,
                            recommended_action: a.recommended_action
                        });
                    }
                }
            }

            // Also query DB if available
            await dbSemaphore.run(async () => {
                const client = await pool.connect();
                try {
                    if (projectIds.length > 0) {
                        const anomRes = await client.query(`
                            SELECT id, project_id, type, description, expected_detection 
                            FROM seed_anomalies 
                            WHERE project_id = ANY($1)
                        `, [projectIds]);
                        
                        for (const row of anomRes.rows) {
                            if (!anomalies.some(a => a.id === row.id)) {
                                anomalies.push(row);
                            }
                        }

                        const readRes = await client.query(`
                            SELECT project_id, monitoring_enabled, alerting_configured, last_dr_test_date, health_score
                            FROM sn_operational_readiness
                            WHERE project_id = ANY($1)
                        `, [projectIds]);
                        readinessFindings.push(...readRes.rows);
                    }
                } finally {
                    client.release();
                }
            });
        }
    } catch (dbErr) {
        // Fallback handled via in-memory ANOMALIES
    }

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, readiness_and_conflict_rules: duration };

    return {
        ...state,
        detectedAnomalies: anomalies,
        readinessFindings,
        timings
    };
}

module.exports = { readinessAndConflictRules };
