// ============================================================================
// load_all.js — Master Seed Pipeline Orchestrator (Team 20)
// ============================================================================
const { pool } = require('./db_pool');
const { loadBaseData } = require('./load_base_csv');
const { loadLeanIX } = require('./load_leanix');
const { loadConfluence } = require('./load_confluence');
const { loadSharePoint } = require('./load_sharepoint');
const { loadGitHub } = require('./load_github');
const { loadJira } = require('./load_jira');
const { loadTeams } = require('./load_teams');
const { loadServiceNow } = require('./load_servicenow');
const { chunkAllDocuments } = require('./chunk_and_vectorize');

async function seedDatabase() {
    console.log('🚀 Starting Master Database Seed & Ingestion Pipeline...');
    console.time('Total Seeding Duration');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Layer A Master & Canonical CSVs
        await loadBaseData(client);

        // 2. Layer B Typed Sources
        await loadLeanIX(client);
        await loadConfluence(client);
        await loadSharePoint(client);
        await loadGitHub(client);
        await loadJira(client);
        await loadTeams(client);
        await loadServiceNow(client);

        // 3. Layer C Semantic Graph Rebuild
        console.log('🕸️ Rebuilding Semantic Knowledge Graph (Layer C)...');
        const graphRes = await client.query('SELECT rebuild_graph() AS result;');
        console.log('Graph Rebuild Result:', graphRes.rows[0].result);

        // 4. Layer D Knowledge Chunking & Full-Text Vectors
        await chunkAllDocuments(client);

        // 5. Populate Entity Aliases for fast sub-50ms entity resolution
        console.log('🏷️ Seeding Entity Aliases (Layer C/Agent)...');
        await client.query('SELECT seed_entity_aliases();');

        // 5. Layer E Record Sync Run
        await client.query(`
            INSERT INTO sync_run (source_system, status, records_processed)
            VALUES ('master_seed_pipeline', 'SUCCESS', 31)
        `);

        await client.query('COMMIT');
        console.timeEnd('Total Seeding Duration');
        console.log('🎉 Database Seeding & Semantic Layer Build Completed Successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Master Seeding Pipeline Failed:', err);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
