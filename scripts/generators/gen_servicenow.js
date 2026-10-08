// ============================================================================
// gen_servicenow.js — ITSM, CMDB CIs, Incidents, Changes, KBs & Readiness Generator
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, people, heroProjectIds, rng } = require('./utils');

function generateServiceNow() {
    console.log('🚨 Generating ServiceNow CMDB CIs, Incidents, Changes, KBs & Readiness...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'servicenow');
    fs.mkdirSync(outDir, { recursive: true });

    const itsmData = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const isLive = (p.status === 'Live');

        // CMDB CI
        const ciId = `CI-APP-${p.project_id.replace(/^P-/, '')}`;
        const cis = [
            {
                id: ciId,
                project_id: p.project_id,
                name: `${p.name} Production Application Service`,
                ci_class: 'Business Application',
                environment: 'Production',
                status: 'Operational',
                support_tier: p.business_criticality === 'critical' ? 'Tier-1' : 'Tier-2'
            }
        ];

        // Incidents (Only on Live projects)
        const incidents = [];
        if (isLive) {
            const incCount = isHero ? 12 : 5;
            for (let i = 1; i <= incCount; i++) {
                const incId = `INC-${p.project_id.replace(/^P-/, '')}-${i.toString().padStart(4, '0')}`;
                const isP1 = (i === 1);
                const priority = isP1 ? 'P1' : (i === 2 ? 'P2' : 'P3');

                incidents.push({
                    id: incId,
                    project_id: p.project_id,
                    ci_id: ciId,
                    priority: priority,
                    state: 'Resolved',
                    short_description: `${priority} - Temporary database connection pool exhaustion during peak ingestion on ${p.name}`,
                    root_cause: 'PostgreSQL connection threshold reached due to burst of batch requests.',
                    resolution_notes: 'Increased max connection limit in PgBouncer pool and enabled query caching.',
                    opened_at: '2026-07-14T03:22:00Z',
                    resolved_at: '2026-07-14T05:10:00Z',
                    assigned_to_person_id: p.tech_lead_id
                });
            }

            // Planted Anomaly ANOM-12: P-DTFS-01 has 2 open P1 incidents > 48h
            if (p.project_id === 'P-DTFS-01') {
                incidents.push(
                    {
                        id: `INC-DTFS-01-BREACH-01`,
                        project_id: 'P-DTFS-01',
                        ci_id: ciId,
                        priority: 'P1',
                        state: 'Open', // Anomaly ANOM-12
                        short_description: `P1 - Critical loan calculation engine deadlock on active dealer applications`,
                        root_cause: 'Distributed lock acquisition timeout across microservice instances.',
                        resolution_notes: null,
                        opened_at: '2026-10-04T08:15:00Z', // > 48h ago
                        resolved_at: null,
                        assigned_to_person_id: p.tech_lead_id
                    },
                    {
                        id: `INC-DTFS-01-BREACH-02`,
                        project_id: 'P-DTFS-01',
                        ci_id: ciId,
                        priority: 'P1',
                        state: 'In Progress', // Anomaly ANOM-12
                        short_description: `P1 - Kafka consumer lag exceeding 1.2M unacknowledged credit evaluation events`,
                        root_cause: 'Downstream scoring engine unresponsive.',
                        resolution_notes: null,
                        opened_at: '2026-10-04T11:30:00Z', // > 48h ago
                        resolved_at: null,
                        assigned_to_person_id: p.tech_lead_id
                    }
                );
            }
        }

        // Change Requests
        const changes = [
            {
                id: `CHG-${p.project_id.replace(/^P-/, '')}-0101`,
                project_id: p.project_id,
                ci_id: ciId,
                type: 'Normal',
                risk: 'Moderate',
                state: 'Closed',
                cab_approved: true,
                title: `Quarterly Kernel & PostgreSQL Minor Version Maintenance Upgrade`,
                description: `Apply scheduled security updates and patch CVE vulnerabilities.`,
                implementation_plan: `Execute rolling upgrade on Kubernetes nodes with automated health check validation.`,
                backout_plan: `Revert AKS node pool image to prior baseline snapshot.`,
                requested_by_person_id: p.tech_lead_id
            }
        ];

        // Planted Anomaly ANOM-13: P-FIN-01 has unapproved emergency change CHG-9021
        if (p.project_id === 'P-FIN-01') {
            changes.push({
                id: 'CHG-9021',
                project_id: 'P-FIN-01',
                ci_id: ciId,
                type: 'Emergency', // Anomaly ANOM-13
                risk: 'Very High',
                state: 'Closed',
                cab_approved: false, // Contradiction: Closed emergency change WITHOUT CAB approval
                title: 'EMERGENCY - Hotfix direct database table lock on SAP S/4HANA core ledger',
                description: 'Direct schema index rebuild executed directly in production without scheduled CAB review.',
                implementation_plan: 'Direct SQL execution on master node.',
                backout_plan: 'None.',
                requested_by_person_id: p.tech_lead_id
            });
        }

        // KB Articles
        const kbArticles = [
            {
                id: `KB-${p.project_id.replace(/^P-/, '')}-01`,
                project_id: p.project_id,
                ci_id: ciId,
                title: `SOP: Triage & Resolution of Ingestion Desynchronization on ${p.name}`,
                category: 'Troubleshooting',
                article_body: `When downstream systems report missing records for ${p.name}, verify Kafka offset status in Azure Event Hubs and trigger a replay from the high-watermark.`,
                author_person_id: p.tech_lead_id
            }
        ];

        // Operational Readiness Record
        // Planted Anomaly ANOM-06: P-CYB-02 has DR test date > 18 months ago (2024-03-10)
        let drTestDate = '2026-04-12';
        if (p.project_id === 'P-CYB-02') {
            drTestDate = '2024-03-10'; // > 540 days ago (Anomaly ANOM-06)
        }

        const readiness = {
            project_id: p.project_id,
            monitoring_enabled: true,
            alerting_configured: true,
            backup_configured: true,
            last_dr_test_date: drTestDate,
            on_call_rota_active: true,
            runbook_exists: true,
            runbook_url: `https://autonova.sharepoint.com/sites/${p.project_id}/Runbooks`,
            health_score: (p.project_id === 'P-CYB-02' || p.project_id === 'P-DTFS-01') ? 72.0 : 96.0
        };

        itsmData.push({
            project_id: p.project_id,
            cis,
            incidents,
            changes,
            kb_articles: kbArticles,
            readiness
        });
    }

    fs.writeFileSync(path.join(outDir, 'servicenow_itsm.json'), JSON.stringify(itsmData, null, 2));
    console.log(`✅ Generated ${itsmData.length} ServiceNow ITSM operational profiles, incidents, changes and readiness scorecards!`);
}

if (require.main === module) {
    generateServiceNow();
}

module.exports = { generateServiceNow };
