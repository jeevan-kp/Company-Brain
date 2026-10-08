// ============================================================================
// load_servicenow.js — Ingests ServiceNow CMDB CIs, Incidents, Changes & KBs
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadServiceNow(client) {
    console.log('🚨 Loading ServiceNow Operations Data into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'servicenow', 'servicenow_itsm.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`ServiceNow data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const itsmRecords = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const rec of itsmRecords) {
        // CIs
        for (const ci of (rec.cis || [])) {
            await client.query(`
                INSERT INTO sn_ci (id, project_id, name, ci_class, environment, status, support_tier)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, environment = EXCLUDED.environment
            `, [ci.id, rec.project_id, ci.name, ci.ci_class, ci.environment, ci.status, ci.support_tier]);
        }

        // Incidents
        for (const inc of (rec.incidents || [])) {
            const sourceItemId = await upsertSourceItem(client, 'servicenow', inc.id, rec.project_id, inc, inc.opened_at);

            await client.query(`
                INSERT INTO sn_incident (
                    id, project_id, ci_id, priority, state, short_description, 
                    root_cause, resolution_notes, opened_at, resolved_at, assigned_to_person_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO UPDATE SET
                    priority = EXCLUDED.priority,
                    state = EXCLUDED.state,
                    short_description = EXCLUDED.short_description,
                    root_cause = EXCLUDED.root_cause,
                    resolved_at = EXCLUDED.resolved_at
            `, [
                inc.id, rec.project_id, inc.ci_id, inc.priority, inc.state, inc.short_description,
                inc.root_cause, inc.resolution_notes, inc.opened_at, inc.resolved_at, inc.assigned_to_person_id
            ]);

            // Index Incident into Document
            await upsertDocument(client, {
                project_id: rec.project_id,
                source_system: 'servicenow',
                source_item_id: sourceItemId,
                external_id: inc.id,
                title: `[${inc.priority}] ${inc.short_description}`,
                doc_type: 'sn_incident',
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: inc.assigned_to_person_id,
                updated_at: inc.opened_at,
                raw_text: `Incident ID: ${inc.id}\nPriority: ${inc.priority}\nState: ${inc.state}\nCI: ${inc.ci_id}\n\nSummary: ${inc.short_description}\n\nRoot Cause: ${inc.root_cause || 'Under investigation'}\n\nResolution Notes: ${inc.resolution_notes || 'Pending'}`,
                metadata: { priority: inc.priority, state: inc.state }
            });
        }

        // Changes
        for (const chg of (rec.changes || [])) {
            await client.query(`
                INSERT INTO sn_change (
                    id, project_id, ci_id, type, risk, state, cab_approved, 
                    title, description, implementation_plan, backout_plan, requested_by_person_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO UPDATE SET
                    type = EXCLUDED.type,
                    state = EXCLUDED.state,
                    cab_approved = EXCLUDED.cab_approved,
                    title = EXCLUDED.title
            `, [
                chg.id, rec.project_id, chg.ci_id, chg.type, chg.risk, chg.state, chg.cab_approved,
                chg.title, chg.description, chg.implementation_plan, chg.backout_plan, chg.requested_by_person_id
            ]);
        }

        // KB Articles
        for (const kb of (rec.kb_articles || [])) {
            const sourceItemId = await upsertSourceItem(client, 'servicenow', kb.id, rec.project_id, kb);

            await client.query(`
                INSERT INTO sn_kb_article (id, project_id, ci_id, title, category, article_body, author_person_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, article_body = EXCLUDED.article_body
            `, [kb.id, rec.project_id, kb.ci_id, kb.title, kb.category, kb.article_body, kb.author_person_id]);

            // Index KB article into Document
            await upsertDocument(client, {
                project_id: rec.project_id,
                source_system: 'servicenow',
                source_item_id: sourceItemId,
                external_id: kb.id,
                title: kb.title,
                doc_type: 'kb_article',
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: kb.author_person_id,
                raw_text: `# Knowledge Base: ${kb.title}\n\nCategory: ${kb.category}\n\n${kb.article_body}`,
                metadata: { category: kb.category }
            });
        }

        // Operational Readiness
        if (rec.readiness) {
            const r = rec.readiness;
            await client.query(`
                INSERT INTO sn_operational_readiness (
                    project_id, monitoring_enabled, alerting_configured, backup_configured, 
                    last_dr_test_date, on_call_rota_active, runbook_exists, runbook_url, health_score
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (project_id) DO UPDATE SET
                    monitoring_enabled = EXCLUDED.monitoring_enabled,
                    alerting_configured = EXCLUDED.alerting_configured,
                    backup_configured = EXCLUDED.backup_configured,
                    last_dr_test_date = EXCLUDED.last_dr_test_date,
                    health_score = EXCLUDED.health_score
            `, [r.project_id, r.monitoring_enabled, r.alerting_configured, r.backup_configured, r.last_dr_test_date, r.on_call_rota_active, r.runbook_exists, r.runbook_url, r.health_score]);
        }
    }

    console.log('✅ ServiceNow Layer B & D Data loaded successfully!');
}

module.exports = { loadServiceNow };
