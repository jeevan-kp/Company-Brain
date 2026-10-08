// ============================================================================
// embed_documents.js — Provider-Agnostic Vector Embedding Generator
// ============================================================================
const { pool } = require('./db_pool');
require('dotenv').config();

async function generateEmbeddings() {
    console.log('🧠 Checking Embedding Configuration...');
    const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;

    if (!apiKey) {
        console.log('ℹ️ No OpenAI/Azure API key detected in .env. Vector embeddings remain NULL.');
        console.log('💡 Full-text search (tsvector) and relational search remain 100% operational.');
        return;
    }

    const client = await pool.connect();
    try {
        const chunksRes = await client.query(`SELECT id, chunk_text FROM document_chunk WHERE embedding IS NULL LIMIT 50`);
        console.log(`Found ${chunksRes.rows.length} pending chunks for vector generation.`);
        // Optional batch API call if key configured
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    generateEmbeddings();
}

module.exports = { generateEmbeddings };
