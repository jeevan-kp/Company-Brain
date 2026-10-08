// ============================================================================
// chunk_and_vectorize.js — Splits documents into chunks and prepares tsvector & vectors
// ============================================================================
const { pool } = require('./db_pool');

function chunkText(text, maxChars = 1600, overlapChars = 200) {
    if (!text || text.trim().length === 0) return [];
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + maxChars, text.length);
        if (end < text.length) {
            const nextNewline = text.lastIndexOf('\n', end);
            if (nextNewline > start + (maxChars / 2)) {
                end = nextNewline;
            }
        }

        const chunk = text.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        if (end >= text.length) break;
        start = end - overlapChars;
        if (start >= end) start = end;
    }

    return chunks;
}

async function chunkAllDocuments(client) {
    console.log('✂️ Chunking documents into document_chunk table...');
    const docsRes = await client.query(`SELECT id, project_id, title, doc_type, raw_text, metadata FROM document`);
    console.log(`Found ${docsRes.rows.length} documents to chunk.`);

    let totalChunks = 0;

    for (const doc of docsRes.rows) {
        const textChunks = chunkText(doc.raw_text);
        
        for (let idx = 0; idx < textChunks.length; idx++) {
            const chunkStr = textChunks[idx];
            const tokenEstimate = Math.ceil(chunkStr.length / 4);

            await client.query(`
                INSERT INTO document_chunk (document_id, project_id, chunk_index, chunk_text, token_count, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (document_id, chunk_index) DO UPDATE SET
                    chunk_text = EXCLUDED.chunk_text,
                    token_count = EXCLUDED.token_count,
                    metadata = EXCLUDED.metadata
            `, [
                doc.id,
                doc.project_id,
                idx,
                chunkStr,
                tokenEstimate,
                JSON.stringify({ title: doc.title, doc_type: doc.doc_type, ...doc.metadata })
            ]);

            totalChunks++;
        }
    }

    console.log(`✅ Created ${totalChunks} document chunks with full-text tsvector indexes!`);
}

module.exports = { chunkAllDocuments };
