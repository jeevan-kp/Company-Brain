// ============================================================================
// load_sharepoint.js — Ingests SharePoint Sites & Deep Runbooks into Layer B & D
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadSharePoint(client) {
    console.log('📄 Loading SharePoint Data into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'sharepoint', 'sharepoint_sites.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`SharePoint data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const sites = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const site of sites) {
        await client.query(`
            INSERT INTO sp_site (id, project_id, title, url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
        `, [site.site_id, site.project_id, site.title, `https://autonova.sharepoint.com/sites/${site.project_id}`]);

        // Documents
        for (const doc of (site.documents || [])) {
            const sourceItemId = await upsertSourceItem(client, 'sharepoint', doc.id, site.project_id, doc, doc.updated_at);

            await client.query(`
                INSERT INTO sp_document (
                    id, site_id, project_id, name, doc_type, version, 
                    content_text, charter_sponsor_person_id, charter_budget_capex, charter_budget_opex, 
                    author_person_id, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    content_text = EXCLUDED.content_text,
                    charter_budget_capex = EXCLUDED.charter_budget_capex,
                    updated_at = EXCLUDED.updated_at
            `, [
                doc.id, site.site_id, site.project_id, doc.name, doc.doc_type, doc.version,
                doc.content_text, doc.charter_sponsor_person_id || null, doc.charter_budget_capex || null,
                doc.charter_budget_opex || null, doc.author, doc.updated_at
            ]);

            // Index into Layer D Document
            let sensitivity = 'internal';
            let allowedRoles = ['Developer', 'Architect', 'PM', 'Management', 'Support'];
            if (doc.doc_type === 'Charter' || doc.doc_type === 'RiskRegister') {
                sensitivity = 'confidential';
                allowedRoles = ['Management', 'PM', 'Architect'];
            }

            await upsertDocument(client, {
                project_id: site.project_id,
                source_system: 'sharepoint',
                source_item_id: sourceItemId,
                external_id: doc.id,
                title: doc.name,
                doc_type: doc.doc_type,
                sensitivity: sensitivity,
                allowed_roles: allowedRoles,
                author: doc.author,
                updated_at: doc.updated_at,
                url_mock: `https://autonova.sharepoint.com/sites/${site.project_id}/Docs/${doc.id}`,
                raw_text: doc.content_text,
                metadata: { file_name: doc.name, doc_type: doc.doc_type }
            });
        }
    }

    console.log('✅ SharePoint Layer B & D Data loaded successfully!');
}

module.exports = { loadSharePoint };
