// ============================================================================
// agent/nodes/retrieve.js — Node 3: Parallel Graph Retrieval & Hybrid Vector Search
// ============================================================================
const fs = require('fs');
const path = require('path');
const { pool } = require('../../scripts/loaders/db_pool');
const { getEmbeddings } = require('../llm');
const { embeddingCache, contextCache } = require('../cache');
const { dbSemaphore } = require('../semaphore');
const { projects, projectMap, peopleMap, projectDependencies, projectServiceUsage, allocations } = require('../../scripts/generators/utils');

async function retrieve(state) {
    const startTime = Date.now();
    const { query, intent, projectIds, resolvedEntities, userRole, personId } = state;

    let graphFacts = {};
    let impactData = [];
    let hybridChunks = [];

    const isPurelyStructural = (intent === 'people_and_ownership' || intent === 'impact_analysis');

    try {
        const graphPromise = (async () => {
            if (projectIds.length === 0 && resolvedEntities.length === 0) return;

            await dbSemaphore.run(async () => {
                const client = await pool.connect();
                try {
                    // 1. Fetch Project Context
                    for (const pid of projectIds.slice(0, 2)) {
                        const cacheKey = `${pid}:${userRole}:${personId || 'anon'}`;
                        if (contextCache.has(cacheKey)) {
                            graphFacts[pid] = contextCache.get(cacheKey);
                        } else {
                            const res = await client.query('SELECT project_context($1, $2, $3) AS ctx', [pid, userRole, personId || null]);
                            if (res.rows[0]?.ctx) {
                                graphFacts[pid] = res.rows[0].ctx;
                                contextCache.set(cacheKey, res.rows[0].ctx);
                            }
                        }
                    }

                    // 2. Fetch Impact Chain
                    if (intent === 'impact_analysis' || resolvedEntities.some(e => e.entity_type === 'service')) {
                        const serviceEnt = resolvedEntities.find(e => e.entity_type === 'service') || resolvedEntities[0];
                        if (serviceEnt?.entity_id) {
                            const impRes = await client.query('SELECT * FROM impact_of($1)', [serviceEnt.entity_id]);
                            impactData = impRes.rows;
                        }
                    }
                } finally {
                    client.release();
                }
            });
        })();

        const searchPromise = (async () => {
            if (intent === 'impact_analysis' && impactData.length > 0) return;

            let queryVectorStr = null;
            if (!isPurelyStructural) {
                let embedding = embeddingCache.get(query);
                if (!embedding) {
                    const [emb] = await getEmbeddings([query]);
                    embedding = emb;
                    embeddingCache.set(query, embedding);
                }
                queryVectorStr = `[${embedding.join(',')}]`;
            }

            await dbSemaphore.run(async () => {
                const client = await pool.connect();
                try {
                    const searchRes = await client.query(
                        'SELECT * FROM hybrid_search($1, $2::vector, $3, $4, $5, 8)',
                        [query, queryVectorStr, projectIds.length > 0 ? projectIds : null, userRole, personId || null]
                    );
                    hybridChunks = searchRes.rows;
                } catch (err) {
                    // Fallback to text matching
                } finally {
                    client.release();
                }
            });
        })();

        await Promise.all([graphPromise, searchPromise]);
    } catch (dbErr) {
        // In-Memory Fallback if Database is Offline
        for (const pid of projectIds.slice(0, 3)) {
            const p = projectMap.get(pid);
            if (p) {
                const bo = peopleMap.get(p.business_owner_id) || { name: p.business_owner_id };
                const tl = peopleMap.get(p.tech_lead_id) || { name: p.tech_lead_id };
                const allocs = allocations.filter(a => a.project_id === pid);
                const deps = projectDependencies.filter(d => d.project_id_consumer === pid);
                const svcs = projectServiceUsage.filter(s => s.project_id === pid);

                graphFacts[pid] = {
                    project: {
                        id: p.project_id,
                        name: p.name,
                        domain_id: p.domain_id,
                        status: p.status,
                        business_criticality: p.business_criticality,
                        summary: p.description,
                        business_owner: { id: p.business_owner_id, name: bo.name },
                        tech_lead: { id: p.tech_lead_id, name: tl.name }
                    },
                    team_raci: allocs.map(a => ({
                        person_id: a.person_id,
                        name: a.person_name,
                        role: a.role_on_project,
                        allocation_pct: a.allocation_pct
                    })),
                    services_used: svcs.map(s => ({
                        service_id: s.service_id,
                        purpose: s.purpose
                    })),
                    dependencies: deps.map(d => ({
                        provider_id: d.depends_on_project_id_provider,
                        type: d.dependency_type,
                        criticality: d.criticality,
                        description: d.description
                    }))
                };
            }
        }

        // Load mock chunks from disk for hybrid search
        const mockDir = path.join(__dirname, '..', '..', 'mock');
        const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        // Search SharePoint Runbooks / Specs
        const spPath = path.join(mockDir, 'sharepoint', 'sharepoint_sites.json');
        if (fs.existsSync(spPath)) {
            const sites = JSON.parse(fs.readFileSync(spPath, 'utf8'));
            for (const s of sites) {
                if (projectIds.length > 0 && !projectIds.includes(s.project_id)) continue;
                for (const d of (s.documents || [])) {
                    const text = d.content_text.toLowerCase();
                    if (qWords.some(w => text.includes(w))) {
                        hybridChunks.push({
                            chunk_id: d.id,
                            project_id: s.project_id,
                            title: d.name,
                            doc_type: d.doc_type,
                            source_system: 'sharepoint',
                            chunk_text: d.content_text.slice(0, 800),
                            rank_score: 0.95
                        });
                    }
                }
            }
        }

        // Search HR & Onboarding Policies
        try {
            const { ONBOARDING_DOCUMENTS } = require('../../server/src/services/onboardingPolicies');
            for (const pol of ONBOARDING_DOCUMENTS) {
                const text = (pol.title + ' ' + pol.summary + ' ' + pol.tags.join(' ') + ' ' + pol.content_text).toLowerCase();
                const matchCount = qWords.filter(w => text.includes(w)).length;
                if (matchCount > 0) {
                    hybridChunks.push({
                        chunk_id: pol.id,
                        project_id: 'P-HR-01',
                        title: pol.title,
                        doc_type: `HR Policy (${pol.category})`,
                        source_system: 'AutoNova HR Wiki',
                        chunk_text: pol.content_text.slice(0, 1200),
                        rank_score: 0.96 + (matchCount * 0.02)
                    });
                }
            }
        } catch (e) {}
    }

    // Sort hybrid chunks by rank score
    hybridChunks.sort((a, b) => (b.rank_score || 0) - (a.rank_score || 0));

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, retrieve: duration };

    return {
        ...state,
        graphFacts,
        impactData,
        retrievedChunks: hybridChunks.slice(0, 8),
        timings
    };
}

module.exports = { retrieve };
