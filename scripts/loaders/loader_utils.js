// ============================================================================
// loader_utils.js — Common Ingestion Helpers, Hashing & Source Item Upsert
// ============================================================================
const crypto = require('crypto');

function computeHash(payload) {
    const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

async function upsertSourceItem(client, sourceSystem, externalId, projectId, payload, updatedAt = null) {
    const hash = computeHash(payload);
    const res = await client.query(`
        INSERT INTO source_item (source_system, external_id, project_id, payload, content_hash, source_updated_at, fetched_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (source_system, external_id) DO UPDATE SET
            payload = EXCLUDED.payload,
            content_hash = EXCLUDED.content_hash,
            source_updated_at = EXCLUDED.source_updated_at,
            fetched_at = CURRENT_TIMESTAMP
        RETURNING id
    `, [sourceSystem, externalId, projectId, payload, hash, updatedAt || new Date()]);

    return res.rows[0].id;
}

async function upsertDocument(client, doc) {
    const res = await client.query(`
        INSERT INTO document (
            project_id, source_system, source_item_id, external_id, title, 
            doc_type, sensitivity, allowed_roles, author, updated_at, url_mock, raw_text, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
    `, [
        doc.project_id,
        doc.source_system,
        doc.source_item_id || null,
        doc.external_id,
        doc.title,
        doc.doc_type,
        doc.sensitivity || 'internal',
        doc.allowed_roles || ['Developer', 'Architect', 'PM', 'Management', 'Support'],
        doc.author || 'System',
        doc.updated_at || new Date(),
        doc.url_mock || null,
        doc.raw_text,
        doc.metadata || {}
    ]);

    return res.rows[0].id;
}

module.exports = {
    computeHash,
    upsertSourceItem,
    upsertDocument
};
