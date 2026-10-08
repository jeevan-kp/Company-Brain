// ============================================================================
// load_confluence.js — Ingests Confluence Spaces, Pages, ADRs into Layer B & D
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadConfluence(client) {
    console.log('📚 Loading Confluence Data into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'confluence', 'confluence_spaces.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Confluence data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const spaces = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const space of spaces) {
        await client.query(`
            INSERT INTO cf_space (id, project_id, name, description, url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        `, [space.space_key, space.project_id, space.name, space.description, `https://autonova.atlassian.net/wiki/spaces/${space.space_key}`]);

        // Pages
        for (const page of (space.pages || [])) {
            const sourceItemId = await upsertSourceItem(client, 'confluence', page.id, space.project_id, page);

            await client.query(`
                INSERT INTO cf_page (id, space_id, project_id, title, page_type, body_md, labels, author_person_id, version)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body_md = EXCLUDED.body_md, version = EXCLUDED.version
            `, [page.id, space.space_key, space.project_id, page.title, page.page_type, page.body_md, page.labels, page.author, page.version]);

            // Index into Layer D Document
            await upsertDocument(client, {
                project_id: space.project_id,
                source_system: 'confluence',
                source_item_id: sourceItemId,
                external_id: page.id,
                title: page.title,
                doc_type: page.page_type,
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: page.author,
                url_mock: `https://autonova.atlassian.net/wiki/spaces/${space.space_key}/pages/${page.id}`,
                raw_text: `${page.title}\n\n${page.body_md}`,
                metadata: { space: space.space_key, labels: page.labels }
            });
        }

        // ADRs
        for (const adr of (space.adrs || [])) {
            await client.query(`
                INSERT INTO adr (id, project_id, title, status, context, decision, consequences, chosen_technology, decided_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, decision = EXCLUDED.decision, chosen_technology = EXCLUDED.chosen_technology
            `, [adr.id, space.project_id, adr.title, adr.status, adr.context, adr.decision, adr.consequences, adr.chosen_technology, adr.decided_by]);

            // Index ADR as document
            await upsertDocument(client, {
                project_id: space.project_id,
                source_system: 'confluence',
                external_id: adr.id,
                title: adr.title,
                doc_type: 'adr',
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: adr.decided_by,
                raw_text: `${adr.title}\n\nStatus: ${adr.status}\n\nContext: ${adr.context}\n\nDecision: ${adr.decision}\n\nChosen Tech: ${adr.chosen_technology}\n\nConsequences: ${adr.consequences}`,
                metadata: { chosen_technology: adr.chosen_technology, status: adr.status }
            });
        }

        // Processes
        for (const proc of (space.processes || [])) {
            await client.query(`
                INSERT INTO project_process (id, project_id, name, process_type, steps)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, steps = EXCLUDED.steps
            `, [proc.id, space.project_id, proc.name, proc.process_type, proc.steps]);
        }
    }

    console.log('✅ Confluence Layer B & D Data loaded successfully!');
}

module.exports = { loadConfluence };
