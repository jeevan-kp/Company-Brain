// ============================================================================
// verify.js — Test Runner & Assertion Validator for Company Brain Layer
// ============================================================================
const fs = require('fs');
const path = require('path');
const { pool } = require('./loaders/db_pool');

async function runVerification() {
    console.log('🧪 Running Company Brain Verification Suite...');
    const client = await pool.connect();

    let passedTests = 0;
    let failedTests = 0;

    function assertTest(name, condition, details = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${name} — ${details}`);
            failedTests++;
        }
    }

    try {
        console.log('\n--- 1. Referential Integrity & Foreign Key Checks ---');
        const orphanChecks = [
            { name: 'LeanIX Apps linked to Project Master', query: 'SELECT COUNT(*) FROM lx_application WHERE project_id NOT IN (SELECT id FROM project)' },
            { name: 'Confluence Spaces linked to Project Master', query: 'SELECT COUNT(*) FROM cf_space WHERE project_id NOT IN (SELECT id FROM project)' },
            { name: 'SharePoint Sites linked to Project Master', query: 'SELECT COUNT(*) FROM sp_site WHERE project_id NOT IN (SELECT id FROM project)' },
            { name: 'GitHub Repos linked to Project Master', query: 'SELECT COUNT(*) FROM gh_repo WHERE project_id NOT IN (SELECT id FROM project)' },
            { name: 'Jira Projects linked to Project Master', query: 'SELECT COUNT(*) FROM jira_project WHERE project_id NOT IN (SELECT id FROM project)' },
            { name: 'ServiceNow CIs linked to Project Master', query: 'SELECT COUNT(*) FROM sn_ci WHERE project_id NOT IN (SELECT id FROM project)' }
        ];

        for (const check of orphanChecks) {
            const res = await client.query(check.query);
            const count = parseInt(res.rows[0].count, 10);
            assertTest(check.name, count === 0, `Found ${count} orphaned records`);
        }

        console.log('\n--- 2. Core Business Question Derivations via SQL ---');
        // Q1
        const q1 = await client.query(`SELECT COUNT(*) FROM document WHERE project_id = 'P-FIN-01'`);
        assertTest('Derive all documents for P-FIN-01', parseInt(q1.rows[0].count, 10) > 0, `Count: ${q1.rows[0].count}`);

        // Q2
        const q2 = await client.query(`SELECT COUNT(*) FROM v_service_impact WHERE service_id LIKE '%SAP%'`);
        assertTest('Derive SAP Outage Impact chain', parseInt(q2.rows[0].count, 10) > 0, `Impacted count: ${q2.rows[0].count}`);

        // Q3
        const q3 = await client.query(`SELECT COUNT(*) FROM project_person WHERE project_id = 'P-PRO-01'`);
        assertTest('Derive RACI and headcount for P-PRO-01', parseInt(q3.rows[0].count, 10) >= 2, `Allocations count: ${q3.rows[0].count}`);

        // Q4
        const q4 = await client.query(`SELECT COUNT(*) FROM v_cost_center_budget_summary WHERE total_capex_planned > 0`);
        assertTest('Derive Cost Center Budget Variances', parseInt(q4.rows[0].count, 10) >= 5, `Cost centers active: ${q4.rows[0].count}`);

        // Q5
        const q5 = await client.query(`SELECT COUNT(*) FROM project_initiative WHERE initiative_id = 'INIT-02'`);
        assertTest('Derive Projects in Zero Trust Initiative', parseInt(q5.rows[0].count, 10) > 0, `Projects: ${q5.rows[0].count}`);

        console.log('\n--- 3. Planted Anomaly SQL Detection Tests ---');
        const anomalyTests = [
            { id: 'ANOM-01', query: `SELECT COUNT(*) FROM project p JOIN lx_application a ON a.project_id = p.id JOIN lx_lifecycle l ON l.app_id = a.id JOIN jira_issue j ON j.project_id = p.id WHERE p.id = 'P-DTFS-01' AND l.current_phase = 'active' AND j.issue_type = 'Epic' AND j.status != 'Done'` },
            { id: 'ANOM-02', query: `SELECT COUNT(*) FROM sp_document d JOIN project_budget pb ON pb.project_id = d.project_id WHERE d.project_id = 'P-FIN-01' AND d.doc_type = 'Charter' AND d.charter_budget_capex != pb.capex_planned` },
            { id: 'ANOM-03', query: `SELECT COUNT(*) FROM adr a JOIN gh_repo r ON r.project_id = a.project_id WHERE a.project_id = 'P-CYB-01' AND a.chosen_technology ILIKE '%Rust%' AND r.primary_language NOT ILIKE '%Rust%'` },
            { id: 'ANOM-04', query: `SELECT COUNT(*) FROM lx_application a JOIN lx_subscription s ON s.app_id = a.id AND s.role_type = 'Application Owner' JOIN sp_document d ON d.project_id = a.project_id AND d.doc_type = 'Charter' WHERE a.project_id = 'P-PRO-01' AND s.person_id != d.charter_sponsor_person_id` },
            { id: 'ANOM-06', query: `SELECT COUNT(*) FROM project p JOIN sn_operational_readiness o ON o.project_id = p.id WHERE p.id = 'P-CYB-02' AND o.last_dr_test_date < CURRENT_DATE - INTERVAL '540 days'` },
            { id: 'ANOM-07', query: `SELECT COUNT(*) FROM lx_app_itcomponent ac JOIN lx_application a ON a.id = ac.app_id JOIN lx_it_component c ON c.id = ac.component_id WHERE a.project_id = 'P-PRO-01' AND c.eol_date < CURRENT_DATE` },
            { id: 'ANOM-08', query: `SELECT COUNT(*) FROM lx_data_object d JOIN lx_application a ON a.id = d.app_id WHERE a.project_id = 'P-DTFS-02' AND d.contains_pii = TRUE AND d.last_security_review IS NULL` },
            { id: 'ANOM-09', query: `SELECT COUNT(*) FROM project p WHERE p.id = 'P-FIN-02' AND NOT EXISTS (SELECT 1 FROM cf_page cp WHERE cp.project_id = p.id AND cp.page_type = 'architecture-overview')` },
            { id: 'ANOM-12', query: `SELECT COUNT(*) FROM sn_incident i WHERE i.project_id = 'P-DTFS-01' AND i.priority = 'P1' AND i.state IN ('New', 'Open', 'In Progress')` },
            { id: 'ANOM-13', query: `SELECT COUNT(*) FROM sn_change c WHERE c.project_id = 'P-FIN-01' AND c.type = 'Emergency' AND c.cab_approved = FALSE AND c.state = 'Closed'` },
            { id: 'ANOM-15', query: `SELECT COUNT(*) FROM gh_dependency d WHERE d.repo_id LIKE '%p-cyb-02%' AND d.is_vulnerable = TRUE` }
        ];

        for (const a of anomalyTests) {
            const res = await client.query(a.query);
            const count = parseInt(res.rows[0].count, 10);
            assertTest(`Detection query for ${a.id}`, count > 0, `Expected > 0 detection hits, got ${count}`);
        }

        console.log('\n--- 4. Agent SQL Functions & Sub-50ms Latency Benchmarks ---');
        // Test 1: resolve_entities
        const t1Start = Date.now();
        const resEnt = await client.query('SELECT * FROM resolve_entities($1)', ['Security Log Monitoring SIEM']);
        const t1Dur = Date.now() - t1Start;
        assertTest('resolve_entities() returns matches', resEnt.rows.length > 0, `Matches: ${resEnt.rows.length}`);
        assertTest('resolve_entities() latency < 50ms', t1Dur < 50, `Latency: ${t1Dur}ms`);

        // Test 2: project_context
        const t2Start = Date.now();
        const resCtx = await client.query('SELECT project_context($1, $2, $3) AS ctx', ['P-FIN-01', 'Developer', null]);
        const t2Dur = Date.now() - t2Start;
        assertTest('project_context() returns profile', !!resCtx.rows[0]?.ctx?.project, 'Valid JSON');
        assertTest('project_context() latency < 50ms', t2Dur < 50, `Latency: ${t2Dur}ms`);

        // Test 3: impact_of
        const t3Start = Date.now();
        const entRes = await client.query("SELECT id FROM entity WHERE natural_key = 'service:AZ-SEN' LIMIT 1");
        if (entRes.rows[0]?.id) {
            const resImp = await client.query('SELECT * FROM impact_of($1)', [entRes.rows[0].id]);
            const t3Dur = Date.now() - t3Start;
            assertTest('impact_of() returns affected projects', resImp.rows.length > 0, `Impacted count: ${resImp.rows.length}`);
            assertTest('impact_of() latency < 50ms', t3Dur < 50, `Latency: ${t3Dur}ms`);
        }

        // Test 4: hybrid_search
        const t4Start = Date.now();
        const resHyb = await client.query('SELECT * FROM hybrid_search($1, NULL, NULL, $2, NULL, 5)', ['PostgreSQL database connection', 'Developer']);
        const t4Dur = Date.now() - t4Start;
        assertTest('hybrid_search() returns ranked results', resHyb.rows.length > 0, `Results: ${resHyb.rows.length}`);
        assertTest('hybrid_search() latency < 50ms', t4Dur < 50, `Latency: ${t4Dur}ms`);

        console.log('\n--- 5. Full-Text Search (tsvector) Verification ---');
        const ftsRes = await client.query(`SELECT COUNT(*) FROM document_chunk WHERE tsv @@ to_tsquery('english', 'PostgreSQL | Kubernetes | incident')`);
        assertTest('Full-Text search matches keywords', parseInt(ftsRes.rows[0].count, 10) > 0, `Hits: ${ftsRes.rows[0].count}`);

        console.log('\n--- 6. Table Row Counts Summary ---');
        const tables = [
            'department', 'domain', 'cost_center', 'person', 'team', 'project', 
            'project_person', 'project_dependency', 'platform_service', 'lx_application', 
            'cf_page', 'adr', 'sp_document', 'gh_repo', 'gh_commit', 'jira_issue', 
            'tm_meeting', 'sn_incident', 'entity', 'relationship', 'source_item', 
            'document', 'document_chunk'
        ];

        for (const t of tables) {
            const r = await client.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`  📊 ${t.padEnd(25)} : ${r.rows[0].count} rows`);
        }

        console.log(`\n======================================================`);
        console.log(`🏆 Verification Result: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log(`======================================================`);

        if (failedTests > 0) {
            process.exitCode = 1;
        }
    } catch (err) {
        console.error('❌ Verification suite execution failed:', err);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runVerification();
}

module.exports = { runVerification };
