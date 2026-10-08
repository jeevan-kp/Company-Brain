// ============================================================================
// agent/nodes/resolveEntities.js — Node 2: SQL Trigram & Alias Entity Resolution
// ============================================================================
const { pool } = require('../../scripts/loaders/db_pool');
const { dbSemaphore } = require('../semaphore');
const { projects, people, teams, platformServices } = require('../../scripts/generators/utils');

async function resolveEntities(state) {
    const startTime = Date.now();
    let resolvedEntities = [];
    let projectIds = [];

    try {
        await dbSemaphore.run(async () => {
            const client = await pool.connect();
            try {
                const res = await client.query('SELECT * FROM resolve_entities($1)', [state.query]);
                resolvedEntities = res.rows;

                for (const ent of resolvedEntities) {
                    if (ent.entity_type === 'project' && ent.project_id) {
                        if (!projectIds.includes(ent.project_id)) projectIds.push(ent.project_id);
                    } else if (ent.natural_key?.startsWith('project:')) {
                        const pid = ent.natural_key.replace('project:', '');
                        if (!projectIds.includes(pid)) projectIds.push(pid);
                    }
                }
            } finally {
                client.release();
            }
        });
    } catch (err) {
        // Fallback if DB is offline
    }

    // Common Project & Domain Aliases Check
    const qLower = state.query.toLowerCase();
    const KNOWN_ALIASES = {
        'truck leasing': 'P-DTFS-01',
        'truck leasing core': 'P-DTFS-01',
        'loan origination': 'P-DTFS-01',
        'siem': 'P-CYB-01',
        'security log monitoring': 'P-CYB-01',
        'iam': 'P-CYB-02',
        'identity & access': 'P-CYB-02',
        's/4hana': 'P-FIN-01',
        'sap s/4hana': 'P-FIN-01',
        'sap finance': 'P-FIN-01',
        'supplier portal': 'P-PRO-01',
        'dealer management': 'P-SAL-01',
        'successfactors': 'P-HR-01'
    };

    for (const [alias, pid] of Object.entries(KNOWN_ALIASES)) {
        if (qLower.includes(alias)) {
            if (!projectIds.includes(pid)) projectIds.push(pid);
            if (!resolvedEntities.some(e => e.project_id === pid)) {
                resolvedEntities.push({
                    natural_key: `project:${pid}`,
                    entity_type: 'project',
                    entity_name: alias,
                    project_id: pid,
                    match_score: 1.0,
                    matched_alias: alias
                });
            }
        }
    }

    if (resolvedEntities.length === 0) {
        
        // Match Projects & Common Aliases
        const PROJECT_ALIASES = {
            'truck leasing': 'P-DTFS-01',
            'truck leasing core': 'P-DTFS-01',
            'loan origination': 'P-DTFS-01',
            'siem': 'P-CYB-01',
            'security log monitoring': 'P-CYB-01',
            'iam': 'P-CYB-02',
            'identity & access': 'P-CYB-02',
            's/4hana': 'P-FIN-01',
            'sap s/4hana': 'P-FIN-01',
            'sap finance': 'P-FIN-01',
            'supplier portal': 'P-PRO-01',
            'dealer management': 'P-SAL-01',
            'successfactors': 'P-HR-01'
        };

        for (const [alias, pid] of Object.entries(PROJECT_ALIASES)) {
            if (qLower.includes(alias)) {
                if (!projectIds.includes(pid)) projectIds.push(pid);
                resolvedEntities.push({
                    natural_key: `project:${pid}`,
                    entity_type: 'project',
                    entity_name: alias,
                    project_id: pid,
                    match_score: 1.0,
                    matched_alias: alias
                });
            }
        }

        for (const p of projects) {
            if (qLower.includes(p.project_id.toLowerCase()) || qLower.includes(p.name.toLowerCase())) {
                resolvedEntities.push({
                    natural_key: `project:${p.project_id}`,
                    entity_type: 'project',
                    entity_name: p.name,
                    project_id: p.project_id,
                    match_score: 1.0,
                    matched_alias: p.name
                });
                if (!projectIds.includes(p.project_id)) projectIds.push(p.project_id);
            }
        }

        // Match Services
        for (const s of platformServices) {
            if (qLower.includes(s.service_id.toLowerCase()) || qLower.includes(s.name.toLowerCase())) {
                resolvedEntities.push({
                    natural_key: `service:${s.service_id}`,
                    entity_type: 'service',
                    entity_name: s.name,
                    project_id: null,
                    match_score: 1.0,
                    matched_alias: s.name
                });
            }
        }

        // Match People
        for (const per of people) {
            if (qLower.includes(per.name.toLowerCase()) || qLower.includes(per.person_id.toLowerCase())) {
                resolvedEntities.push({
                    natural_key: `person:${per.person_id}`,
                    entity_type: 'person',
                    entity_name: per.name,
                    project_id: null,
                    match_score: 1.0,
                    matched_alias: per.name
                });
            }
        }
    }

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, resolve_entities: duration };

    return {
        ...state,
        resolvedEntities,
        projectIds,
        timings
    };
}

module.exports = { resolveEntities };
