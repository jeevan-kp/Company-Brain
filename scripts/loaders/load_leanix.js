// ============================================================================
// load_leanix.js — Ingests LeanIX Fact Sheets into Layer B & Source Items
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem } = require('./loader_utils');

async function loadLeanIX(client) {
    console.log('🏛️ Loading LeanIX Data into Layer B...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'leanix', 'leanix_factsheets.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`LeanIX data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 1. Capabilities
    for (const cap of data.catalog.capabilities) {
        await client.query(`
            INSERT INTO lx_business_capability (id, name, level, parent_id, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, description = EXCLUDED.description
        `, [cap.id, cap.name, cap.level, cap.parent_id, cap.name]);
    }

    // 2. IT Components
    for (const comp of data.catalog.it_components) {
        await client.query(`
            INSERT INTO lx_it_component (id, name, category, vendor, version, eol_date, cost_per_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, version = EXCLUDED.version, eol_date = EXCLUDED.eol_date, cost_per_year = EXCLUDED.cost_per_year
        `, [comp.id, comp.name, comp.category, comp.vendor, comp.version, comp.eol, comp.cost]);
    }

    // 3. Applications
    for (const app of data.applications) {
        const sourceItemId = await upsertSourceItem(client, 'leanix', app.id, app.project_id, app, app.lifecycle?.active_date);

        await client.query(`
            INSERT INTO lx_application (
                id, project_id, name, alias, description, application_type, hosting_type, 
                business_criticality, functional_fit, technical_fit, time_classification, 
                sla_percentage, rto_hours, rpo_hours, user_count, annual_run_cost, data_quality_pct,
                compliance_gdpr, compliance_sox, compliance_iso27001, compliance_tisax
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                business_criticality = EXCLUDED.business_criticality,
                annual_run_cost = EXCLUDED.annual_run_cost,
                time_classification = EXCLUDED.time_classification
        `, [
            app.id, app.project_id, app.name, app.alias, app.description, app.application_type, app.hosting_type,
            app.business_criticality, app.functional_fit, app.technical_fit, app.time_classification,
            app.sla_percentage, app.rto_hours, app.rpo_hours, app.user_count, app.annual_run_cost, app.data_quality_pct,
            app.compliance?.gdpr || false, app.compliance?.sox || false, app.compliance?.iso27001 || false, app.compliance?.tisax || false
        ]);

        // Lifecycle
        if (app.lifecycle) {
            await client.query(`
                INSERT INTO lx_lifecycle (app_id, plan_date, phase_in_date, active_date, phase_out_date, end_of_life_date, current_phase)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (app_id) DO UPDATE SET current_phase = EXCLUDED.current_phase, active_date = EXCLUDED.active_date
            `, [app.id, app.lifecycle.plan_date, app.lifecycle.phase_in_date, app.lifecycle.active_date, app.lifecycle.phase_out_date, app.lifecycle.end_of_life_date, app.lifecycle.current_phase]);
        }

        // Subscriptions
        for (const sub of (app.subscriptions || [])) {
            await client.query(`
                INSERT INTO lx_subscription (app_id, person_id, role_type)
                VALUES ($1, $2, $3)
                ON CONFLICT (app_id, person_id, role_type) DO NOTHING
            `, [app.id, sub.person_id, sub.role_type]);
        }

        // Capabilities
        for (const capId of (app.capabilities || [])) {
            await client.query(`
                INSERT INTO lx_app_capability (app_id, capability_id, is_primary)
                VALUES ($1, $2, $3)
                ON CONFLICT (app_id, capability_id) DO NOTHING
            `, [app.id, capId, true]);
        }

        // Components
        for (const comp of (app.components || [])) {
            await client.query(`
                INSERT INTO lx_app_itcomponent (app_id, component_id, environment)
                VALUES ($1, $2, $3)
                ON CONFLICT (app_id, component_id, environment) DO NOTHING
            `, [app.id, comp.id, comp.environment || 'Production']);
        }

        // Data Objects
        for (const dobj of (app.data_objects || [])) {
            await client.query(`
                INSERT INTO lx_data_object (id, app_id, name, sensitivity, contains_pii, retention_period_months, last_security_review)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET sensitivity = EXCLUDED.sensitivity, contains_pii = EXCLUDED.contains_pii, last_security_review = EXCLUDED.last_security_review
            `, [dobj.id, app.id, dobj.name, dobj.sensitivity, dobj.contains_pii, dobj.retention_period_months, dobj.last_security_review]);
        }

        // Interfaces
        for (const iface of (app.interfaces || [])) {
            await client.query(`
                INSERT INTO lx_interface (id, provider_app_id, consumer_app_id, name, protocol, direction, frequency, data_objects, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET protocol = EXCLUDED.protocol, frequency = EXCLUDED.frequency, description = EXCLUDED.description
            `, [iface.id, iface.provider_app_id, iface.consumer_app_id, iface.name, iface.protocol, iface.direction, iface.frequency, iface.data_objects, iface.description]);
        }
    }

    console.log('✅ LeanIX Layer B Data loaded successfully!');
}

module.exports = { loadLeanIX };
