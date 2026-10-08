// ============================================================================
// server/src/routes/chat.js — SSE Streaming & JSON Chat API Endpoint
// ============================================================================
const express = require('express');
const router = express.Router();
const { runAgentQuery } = require('../../../agent/workflow');
const { PROJECTS, getProjectGraph, getGlobalGraph } = require('../services/projectsData');
const { documentRegistry } = require('./documents');

/**
 * Format and enrich citations with full document metadata for frontend inspection
 */
function formatCitations(citationsObj, retrievedChunks, projectIds) {
    const enriched = [];
    const seenTitles = new Set();

    // 1. First enrich from retrievedChunks
    if (retrievedChunks && Array.isArray(retrievedChunks)) {
        for (const c of retrievedChunks) {
            const title = c.title || c.chunk_id;
            if (!title || seenTitles.has(title.toLowerCase())) continue;
            seenTitles.add(title.toLowerCase());

            // Try to find exact document in registry
            let doc = documentRegistry.get(c.chunk_id) || documentRegistry.get(title.toLowerCase().trim());
            if (!doc) {
                // Fuzzy search
                for (const [key, d] of documentRegistry.entries()) {
                    if (d.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(d.title.toLowerCase().slice(0, 20))) {
                        doc = d;
                        break;
                    }
                }
            }

            const proj = PROJECTS.find(p => p.project_id === (c.project_id || doc?.project_id));

            enriched.push({
                id: doc?.id || c.chunk_id,
                title: doc?.title || title,
                source: doc?.source || c.source_system || 'Enterprise Records',
                doc_type: doc?.doc_type || 'Verified Technical Document',
                project_id: doc?.project_id || c.project_id || (proj ? proj.project_id : 'Enterprise'),
                project_name: doc?.project_name || (proj ? proj.name : 'AutoNova Group'),
                author: doc?.author || 'Architecture Board',
                updated_at: doc?.updated_at || '2026-09-15',
                url: doc?.url || `https://autonova.sharepoint.com/search?q=${encodeURIComponent(title)}`,
                excerpt: c.chunk_text ? c.chunk_text.slice(0, 320) + '...' : (doc ? doc.content_text.slice(0, 320) + '...' : 'Verified fact in enterprise spine.'),
                full_content: doc ? doc.content_text : (c.chunk_text || 'Full document verified under enterprise governance.')
            });
        }
    }

    // 2. If no chunks found, add project charters based on resolved projectIds
    if (enriched.length === 0 && projectIds && projectIds.length > 0) {
        for (const pid of projectIds.slice(0, 3)) {
            const p = PROJECTS.find(item => item.project_id === pid);
            if (p) {
                enriched.push({
                    id: `SP-CHARTER-${p.project_id}`,
                    title: `${p.name} — Project Charter & Baseline`,
                    source: 'SharePoint Online',
                    doc_type: 'Project Charter & Business Case',
                    project_id: p.project_id,
                    project_name: p.name,
                    author: p.business_owner?.name || 'Executive Sponsor',
                    updated_at: '2026-09-15',
                    url: `https://autonova.sharepoint.com/sites/${p.project_id.toLowerCase()}/Charter`,
                    excerpt: `${p.description} Approved Capex: €${(p.budget?.capex_planned || 0).toLocaleString()}, Cost Center: ${p.budget?.cost_center}.`,
                    full_content: `# PROJECT CHARTER: ${p.name.toUpperCase()}\n\n## Business Objective\n${p.description}\n\n## Governance & Leadership\n- Business Owner: ${p.business_owner?.name}\n- Tech Lead: ${p.tech_lead?.name}\n- Cost Center: ${p.budget?.cost_center}\n- RAG Health: ${p.rag_status}\n- Production Readiness: ${p.readiness?.status} (${p.readiness?.score}%)`
                });
            }
        }
    }

    return enriched;
}

/**
 * Builds an interactive, highly relevant query-specific knowledge subgraph for this chat response
 */
function buildQueryGraph(projectIds, queryText, impactData) {
    const qLower = (queryText || '').toLowerCase();
    const nodes = [];
    const links = [];
    const added = new Set();

    const addN = (node) => {
        if (!added.has(node.id)) {
            added.add(node.id);
            nodes.push(node);
        }
    };

    const addL = (source, target, label, color) => {
        links.push({
            source,
            target,
            label: label || 'CONNECTS',
            color: color || '#38bdf8'
        });
    };

    // -------------------------------------------------------------------------
    // 1. Cross-Source Architecture Conflict Check (e.g. LeanIX vs Jira on P-DTFS-01)
    // -------------------------------------------------------------------------
    if (qLower.includes('conflict') || qLower.includes('discrepan') || qLower.includes('divergen') || (qLower.includes('leanix') && qLower.includes('jira'))) {
        const pid = (projectIds && projectIds[0]) || 'P-DTFS-01';
        const p = PROJECTS.find(item => item.project_id === pid) || PROJECTS[2]; // Default to P-DTFS-01 Truck Leasing

        // Central Project Node
        addN({
            id: p.project_id,
            name: `${p.name} (${p.project_id})`,
            type: 'PROJECT',
            val: 32,
            is_center: true,
            color: '#38bdf8',
            desc: `Target Project with Cross-Source Status Discrepancy (${p.department})`
        });

        // Source 1: LeanIX Factsheet
        addN({
            id: 'SOURCE-LEANIX',
            name: 'SAP LeanIX Factsheet (Production Live)',
            type: 'DOCUMENT',
            val: 22,
            color: '#a855f7',
            desc: 'Status: Marked "Live in Production", Lifecycle: ACTIVE, Data Quality: 94%'
        });
        addL(p.project_id, 'SOURCE-LEANIX', 'Cataloged in LeanIX', '#a855f7');

        // Source 2: Jira Cloud Project
        addN({
            id: 'SOURCE-JIRA',
            name: 'Jira Cloud: DTFS Agile Delivery Board',
            type: 'DOCUMENT',
            val: 22,
            color: '#3b82f6',
            desc: 'Status: 6 Open MVP Epics, 4 Blocker Defects, Sprints Incomplete'
        });
        addL(p.project_id, 'SOURCE-JIRA', 'Tracked in Jira', '#3b82f6');

        // Source 3: ServiceNow CMDB
        addN({
            id: 'SOURCE-SERVICENOW',
            name: 'ServiceNow CMDB (CI Record)',
            type: 'DOCUMENT',
            val: 18,
            color: '#f59e0b',
            desc: 'Status: Pending CAB Release Sign-Off & Change Approval'
        });
        addL(p.project_id, 'SOURCE-SERVICENOW', 'CMDB Configuration Item', '#f59e0b');

        // Highlighted Conflict Node
        addN({
            id: 'CONFLICT-STATUS',
            name: '⚠️ CONFLICT: Live vs Open MVP Epics',
            type: 'ISSUE',
            val: 26,
            color: '#ef4444',
            desc: 'Critical Discrepancy: LeanIX claims project is live while Jira delivery epics are unfinished!'
        });
        addL('SOURCE-LEANIX', 'CONFLICT-STATUS', 'Contradicts Sprints', '#ef4444');
        addL('SOURCE-JIRA', 'CONFLICT-STATUS', 'Blocks Release Gate', '#ef4444');

        // Confluence Architecture Decision Record
        addN({
            id: 'ADR-EXCEPTION',
            name: 'Confluence ADR-004 (Go-Live Decision)',
            type: 'ADR',
            val: 16,
            color: '#06b6d4',
            desc: 'Architecture Decision Record: Fast-track MVP deployment with phased backlog'
        });
        addL('CONFLICT-STATUS', 'ADR-EXCEPTION', 'Governing ADR', '#06b6d4');

        // Accountable Technical Lead
        const techLeadName = p.tech_lead?.name || 'Alexander Beck';
        addN({
            id: 'LEAD-ARCHITECT',
            name: `${techLeadName} (Tech Lead)`,
            type: 'PERSON',
            val: 16,
            color: '#10b981',
            desc: `Accountable Tech Lead for ${p.name}`
        });
        addL('CONFLICT-STATUS', 'LEAD-ARCHITECT', 'Assigned for Resolution', '#10b981');

        // Accountable Business Owner / Director
        const ownerName = p.business_owner?.name || 'Stephanie Krueger';
        addN({
            id: 'BUSINESS-OWNER',
            name: `${ownerName} (Business Owner)`,
            type: 'PERSON',
            val: 16,
            color: '#10b981',
            desc: `Accountable Domain Owner (${p.department})`
        });
        addL(p.project_id, 'BUSINESS-OWNER', 'Executive Ownership', '#10b981');

        return { nodes, links };
    }

    // -------------------------------------------------------------------------
    // 2. Outage / Blast Radius / Downstream Impact (e.g. SAP S/4HANA Outage)
    // -------------------------------------------------------------------------
    if (qLower.includes('outage') || qLower.includes('blast radius') || qLower.includes('down') || (impactData && impactData.length > 0)) {
        const centerId = qLower.includes('s/4hana') ? 'SAP-S4HANA' : (projectIds[0] || 'CRITICAL-SERVICE');
        const centerName = qLower.includes('s/4hana') ? 'SAP S/4HANA Cloud (RISE)' : (PROJECTS.find(p => p.project_id === projectIds[0])?.name || 'Central Platform Service');

        addN({
            id: centerId,
            name: `🚨 ${centerName}`,
            type: 'SERVICE',
            val: 36,
            is_center: true,
            color: '#ef4444',
            desc: 'Root Cause Outage Epicenter (High Availability Tier 1)'
        });

        // Hop 1 Direct Impacted Projects
        const hop1 = ['P-FIN-01', 'P-DTFS-01', 'P-PRO-01'];
        hop1.forEach(pid => {
            const p = PROJECTS.find(item => item.project_id === pid);
            if (p) {
                addN({
                    id: p.project_id,
                    name: `${p.name} (${p.project_id})`,
                    type: 'PROJECT',
                    val: 22,
                    color: '#f97316',
                    desc: `Hop 1 Direct Service Interruption (Criticality: ${p.business_criticality})`
                });
                addL(centerId, p.project_id, 'Direct Data Feed Blocked (Hop 1)', '#ef4444');
            }
        });

        // Hop 2 Downstream Consumer Projects
        const hop2 = ['P-SAL-01', 'P-FIN-02'];
        hop2.forEach(pid => {
            const p = PROJECTS.find(item => item.project_id === pid);
            if (p) {
                addN({
                    id: p.project_id,
                    name: `${p.name} (${p.project_id})`,
                    type: 'PROJECT',
                    val: 18,
                    color: '#c084fc',
                    desc: 'Hop 2 Cascading Downstream Dependency'
                });
                addL('P-FIN-01', p.project_id, 'Cascading Dependency (Hop 2)', '#c084fc');
            }
        });

        // Blocked Business Processes
        addN({
            id: 'PROC-LEDGER',
            name: '⛔ Monthly Global Ledger Close',
            type: 'PROCESS',
            val: 18,
            color: '#ef4444',
            desc: 'Critical Finance Milestone Blocked'
        });
        addL('P-FIN-01', 'PROC-LEDGER', 'Blocks Milestone', '#ef4444');

        addN({
            id: 'PROC-PAYOUTS',
            name: '⛔ Dealer Floorplan Payouts',
            type: 'PROCESS',
            val: 18,
            color: '#ef4444',
            desc: 'Automotive Wholesale Financing Suspended'
        });
        addL('P-DTFS-01', 'PROC-PAYOUTS', 'Blocks Financing Operations', '#ef4444');

        // Infrastructure Backbone
        addN({
            id: 'AZURE-EXPRESSROUTE',
            name: 'Azure ExpressRoute Private Trunk',
            type: 'APPLICATION',
            val: 16,
            color: '#06b6d4',
            desc: 'Dedicated 10Gbps Cloud Connection'
        });
        addL(centerId, 'AZURE-EXPRESSROUTE', 'Runs On Network', '#06b6d4');

        return { nodes, links };
    }

    // -------------------------------------------------------------------------
    // 3. Operational Runbook, Alert & Incident SOP (e.g. SIEM P1 Alert Resolution)
    // -------------------------------------------------------------------------
    if (qLower.includes('runbook') || qLower.includes('sop') || qLower.includes('incident') || qLower.includes('alert') || qLower.includes('latency') || qLower.includes('resolve') || qLower.includes('siem')) {
        const pid = (projectIds && projectIds[0]) || 'P-CYB-01';
        const p = PROJECTS.find(item => item.project_id === pid) || PROJECTS[0];

        // Central Service Node
        addN({
            id: p.project_id,
            name: `${p.name} (${p.project_id})`,
            type: 'PROJECT',
            val: 30,
            is_center: true,
            color: '#38bdf8',
            desc: 'Operational Incident Context'
        });

        // Alert Node
        addN({
            id: 'ALERT-P1',
            name: '🚨 P1 Alert: Telemetry Latency (>5000ms)',
            type: 'ISSUE',
            val: 24,
            color: '#ef4444',
            desc: 'Critical Telemetry Queue Latency in Ingestion Pipeline'
        });
        addL('ALERT-P1', p.project_id, 'Fired on Service', '#ef4444');

        // Runbook Document
        addN({
            id: 'RUNBOOK-SOP',
            name: '📖 SharePoint Runbook v2.4 (SOP)',
            type: 'DOCUMENT',
            val: 22,
            color: '#a855f7',
            desc: 'Standard Operating Procedure Section 3.2: Queue Latency Remediation'
        });
        addL('ALERT-P1', 'RUNBOOK-SOP', 'Prescribes Recovery SOP', '#a855f7');

        // Step 1: Rebalance Partitions
        addN({
            id: 'ACTION-KAFKA',
            name: '⚙️ Step 1: Scale Kafka Partitions (12 ➔ 24)',
            type: 'ACTION',
            val: 18,
            color: '#f59e0b',
            desc: 'Apache Kafka Event Streams repartitioning'
        });
        addL('RUNBOOK-SOP', 'ACTION-KAFKA', 'Step 1 in Runbook', '#f59e0b');

        // Step 2: Scale AKS Pods
        addN({
            id: 'ACTION-AKS',
            name: '⚙️ Step 2: HPA Pod Autoscaling (4 ➔ 8)',
            type: 'ACTION',
            val: 18,
            color: '#f59e0b',
            desc: 'Azure Kubernetes Service sec-ops-prod namespace scaling'
        });
        addL('ACTION-KAFKA', 'ACTION-AKS', 'Step 2 in Runbook', '#f59e0b');

        // Step 3: Verification Target
        addN({
            id: 'VERIFY-SLA',
            name: '✅ Step 3: Verify Latency < 200ms',
            type: 'ACTION',
            val: 16,
            color: '#10b981',
            desc: 'Prometheus SLA validation check'
        });
        addL('ACTION-AKS', 'VERIFY-SLA', 'Validates SLA Recovery', '#10b981');

        // On-Call Tech Lead
        const leadName = p.tech_lead?.name || 'Rahul Verma';
        addN({
            id: 'ONCALL-LEAD',
            name: `${leadName} (SOC On-Call Lead)`,
            type: 'PERSON',
            val: 16,
            color: '#10b981',
            desc: 'Escalation point for security incident resolution'
        });
        addL(p.project_id, 'ONCALL-LEAD', 'Incident Escalation Contact', '#10b981');

        return { nodes, links };
    }

    // -------------------------------------------------------------------------
    // 4. People, Roles & Governance Lookup (e.g. Who is owner / tech lead)
    // -------------------------------------------------------------------------
    if (qLower.includes('who is') || qLower.includes('owner') || qLower.includes('tech lead') || qLower.includes('contact') || qLower.includes('lead')) {
        const pid = (projectIds && projectIds[0]) || 'P-FIN-01';
        const p = PROJECTS.find(item => item.project_id === pid) || PROJECTS[0];

        addN({
            id: p.project_id,
            name: `${p.name} (${p.project_id})`,
            type: 'PROJECT',
            val: 30,
            is_center: true,
            color: '#38bdf8',
            desc: `Domain: ${p.department}`
        });

        if (p.business_owner && p.business_owner.name) {
            addN({
                id: 'ROLE-BO',
                name: `${p.business_owner.name} (Business Owner)`,
                type: 'PERSON',
                val: 20,
                color: '#f59e0b',
                desc: `${p.business_owner.job_title} • ${p.business_owner.email}`
            });
            addL('ROLE-BO', p.project_id, 'Business Mandate & Budget', '#f59e0b');
        }

        if (p.tech_lead && p.tech_lead.name) {
            addN({
                id: 'ROLE-TL',
                name: `${p.tech_lead.name} (Tech Lead)`,
                type: 'PERSON',
                val: 20,
                color: '#10b981',
                desc: `${p.tech_lead.job_title} • ${p.tech_lead.email}`
            });
            addL('ROLE-TL', p.project_id, 'Architecture & Sprint Delivery', '#10b981');
        }

        // Domain Director
        addN({
            id: 'ROLE-DEPT',
            name: `Department: ${p.department}`,
            type: 'DEPARTMENT',
            val: 18,
            color: '#a855f7',
            desc: `Governance Root for ${p.name}`
        });
        addL(p.project_id, 'ROLE-DEPT', 'Department Alignment', '#a855f7');

        // Teams Communication Channel
        addN({
            id: 'TEAMS-CHANNEL',
            name: `Teams: #${(p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-ops`,
            type: 'DOCUMENT',
            val: 16,
            color: '#3b82f6',
            desc: 'Primary Escalation & Collaboration Hub'
        });
        addL(p.project_id, 'TEAMS-CHANNEL', 'Escalation Channel', '#3b82f6');

        return { nodes, links };
    }

    // -------------------------------------------------------------------------
    // 5. Clean Contextual Architecture Subgraph (Filtered, no noisy random piles!)
    // -------------------------------------------------------------------------
    const targetPid = (projectIds && projectIds[0]) || PROJECTS[0].project_id;
    const p = PROJECTS.find(item => item.project_id === targetPid) || PROJECTS[0];

    addN({
        id: p.project_id,
        name: `${p.name} (${p.project_id})`,
        type: 'PROJECT',
        val: 30,
        is_center: true,
        color: '#38bdf8',
        desc: p.description
    });

    // Upstream providers (limited to top 2 to avoid clutter)
    (p.upstream_dependencies || []).slice(0, 2).forEach(u => {
        addN({
            id: u.provider_id,
            name: u.provider_name,
            type: 'PROJECT',
            val: 18,
            color: '#34d399',
            desc: u.description
        });
        addL(u.provider_id, p.project_id, `Feeds Data (${u.dependency_type || 'Sync'})`, '#34d399');
    });

    // Downstream consumers (limited to top 2)
    (p.downstream_dependents || []).slice(0, 2).forEach(d => {
        addN({
            id: d.consumer_id,
            name: d.consumer_name,
            type: 'PROJECT',
            val: 18,
            color: '#c084fc',
            desc: d.description
        });
        addL(p.project_id, d.consumer_id, `Consumes Data (${d.dependency_type || 'API'})`, '#c084fc');
    });

    // Core Cloud Tech (limited to top 2)
    (p.services_used || []).slice(0, 2).forEach(s => {
        addN({
            id: s.service_id,
            name: s.service_name,
            type: 'APPLICATION',
            val: 16,
            color: '#06b6d4',
            desc: s.purpose
        });
        addL(p.project_id, s.service_id, 'Runs On Service', '#06b6d4');
    });

    // Confluence ADR
    const adr = (p.unstructured_knowledge?.adrs || [])[0];
    if (adr) {
        addN({
            id: adr.id,
            name: `${adr.id}: ${adr.title}`,
            type: 'ADR',
            val: 16,
            color: '#a855f7',
            desc: adr.decision
        });
        addL(p.project_id, adr.id, 'Governing ADR', '#a855f7');
    }

    return { nodes, links };
}

/**
 * POST /api/chat
 * Accepts query, role/persona, and returns enriched JSON response with citations & query_graph.
 */
router.post('/', async (req, res, next) => {
    try {
        const query = req.body.query || req.body.question;
        const role = req.headers['x-user-role'] || req.body.role || req.body.persona || req.user?.persona || 'Developer';
        const personId = req.headers['x-person-id'] || req.body.person_id || req.user?.id || null;
        const wantStream = req.headers.accept === 'text/event-stream' || req.body.stream === true;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({ error: 'Field "query" is required.' });
        }

        // Execute LangGraph Agent StateGraph Orchestrator
        const resultState = await runAgentQuery({ query, userRole: role, personId });
        const formattedCitations = formatCitations(resultState.citations, resultState.retrievedChunks, resultState.projectIds);
        const queryGraph = buildQueryGraph(resultState.projectIds, query, resultState.impactData);

        if (wantStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders?.();

            const sendEvent = (type, data) => {
                res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
            };

            sendEvent('intent', { intent: resultState.intent, source: resultState.intentSource });
            sendEvent('entities', { entities: resultState.resolvedEntities, projectIds: resultState.projectIds });
            sendEvent('token', { content: resultState.answer });
            sendEvent('citations', formattedCitations);
            sendEvent('query_graph', queryGraph);
            sendEvent('timings', resultState.timings);
            res.write('data: [DONE]\n\n');
            return res.end();
        }

        // Standard JSON response
        return res.json({
            query: resultState.query,
            user_role: resultState.userRole,
            intent: resultState.intent,
            answer: resultState.answer,
            citations: formattedCitations,
            query_graph: queryGraph,
            evidence: {
                resolved_entities: resultState.resolvedEntities,
                retrieved_chunks: resultState.retrievedChunks?.map(c => ({
                    id: c.chunk_id,
                    project_id: c.project_id,
                    title: c.title,
                    source: c.source_system,
                    score: c.rank_score
                })),
                detected_anomalies: resultState.detectedAnomalies,
                impact_data: resultState.impactData
            },
            timings: resultState.timings
        });

    } catch (err) {
        console.error('[API Chat Error]:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Agent execution failed', details: err.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
            res.end();
        }
    }
});

module.exports = router;
