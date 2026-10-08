// ============================================================================
// agent/cache.js — LRU Caching for Embeddings & Project Context
// ============================================================================
const { LRUCache } = require('lru-cache');

// LRU Cache for query text -> embedding vector
const embeddingCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 60 * 24 // 24 hours
});

// LRU Cache for project_context SQL outputs
const contextCache = new LRUCache({
    max: 100,
    ttl: 1000 * 60 * 5 // 5 minutes (invalidated on sync)
});

module.exports = {
    embeddingCache,
    contextCache,
    clearAllCaches: () => {
        embeddingCache.clear();
        contextCache.clear();
    }
};
