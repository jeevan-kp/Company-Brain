// ============================================================================
// embed_chunks.js — Resumable Batch Embedding Pipeline (Azure OpenAI)
// ============================================================================
const { pool } = require('./loaders/db_pool');
const { getEmbeddings, config } = require('../agent/llm');
require('dotenv').config();

const BATCH_SIZE = 64;

async function runEmbedChunks() {
    console.log('🔮 Starting Resumable Document Chunk Embedding Pipeline...');
    console.log(`Using Azure Deployment: ${config.embeddingDeployment || 'fallback-embedder'} (${config.embeddingDimensions} dimensions)`);

    const client = await pool.connect();
    let totalEmbedded = 0;

    try {
        // Count pending chunks
        const countRes = await client.query(`SELECT COUNT(*) FROM document_chunk WHERE embedding IS NULL`);
        const pendingCount = parseInt(countRes.rows[0].count, 10);
        console.log(`📊 Found ${pendingCount} chunks pending vector embedding.`);

        if (pendingCount === 0) {
            console.log('✅ All document chunks already have embeddings.');
        } else {
            let processed = 0;

            while (true) {
                // Fetch next batch of unembedded chunks
                const batchRes = await client.query(`
                    SELECT id, chunk_text 
                    FROM document_chunk 
                    WHERE embedding IS NULL 
                    ORDER BY id 
                    LIMIT $1
                `, [BATCH_SIZE]);

                if (batchRes.rows.length === 0) break;

                const chunkIds = batchRes.rows.map(r => r.id);
                const chunkTexts = batchRes.rows.map(r => r.chunk_text);

                // Call Azure OpenAI embedding API
                const embeddings = await getEmbeddings(chunkTexts);

                // Write embeddings back to database
                for (let i = 0; i < chunkIds.length; i++) {
                    const vectorStr = `[${embeddings[i].join(',')}]`;
                    await client.query(`
                        UPDATE document_chunk 
                        SET embedding = $1::vector,
                            metadata = metadata || $2::jsonb
                        WHERE id = $3
                    `, [
                        vectorStr, 
                        JSON.stringify({ 
                            embedding_model: config.embeddingDeployment,
                            embedded_at: new Date().toISOString()
                        }),
                        chunkIds[i]
                    ]);
                }

                processed += chunkIds.length;
                totalEmbedded += chunkIds.length;
                console.log(`  ⚡ Processed ${processed} / ${pendingCount} chunks (${Math.round((processed / pendingCount) * 100)}%)...`);
            }
        }

        console.log(`\n🎉 Embedding pipeline complete! Total newly embedded: ${totalEmbedded}`);

        // Verification: Run a sample cosine search
        console.log('\n🔍 Running verification cosine vector search...');
        const sampleQuery = 'PostgreSQL database connection pooling and failover';
        const [sampleEmbedding] = await getEmbeddings([sampleQuery]);
        const sampleVecStr = `[${sampleEmbedding.join(',')}]`;

        const simRes = await client.query(`
            SELECT dc.id, dc.project_id, doc.title, 
                   1 - (dc.embedding <=> $1::vector) AS cosine_similarity,
                   dc.chunk_text
            FROM document_chunk dc
            JOIN document doc ON doc.id = dc.document_id
            WHERE dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $1::vector ASC
            LIMIT 3
        `, [sampleVecStr]);

        console.log('Top vector similarity matches:');
        simRes.rows.forEach((r, idx) => {
            console.log(`  ${idx + 1}. [${r.project_id}] ${r.title} (Cosine Similarity: ${parseFloat(r.cosine_similarity).toFixed(4)})`);
            console.log(`     Excerpt: ${r.chunk_text.slice(0, 100).replace(/\n/g, ' ')}...`);
        });

    } catch (err) {
        console.error('❌ Embedding pipeline failed:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runEmbedChunks();
}

module.exports = { runEmbedChunks };
