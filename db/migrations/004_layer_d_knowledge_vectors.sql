-- ============================================================================
-- Migration 004: Layer D — Knowledge, Evidence and Vectors
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Raw Source Item (Immutable payload + content_hash for incremental sync)
CREATE TABLE IF NOT EXISTS source_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system VARCHAR(50) NOT NULL CHECK (source_system IN ('leanix', 'confluence', 'sharepoint', 'github', 'jira', 'teams', 'servicenow', 'base_csv')),
    external_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(50) REFERENCES project(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of payload
    source_updated_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_source_item UNIQUE (source_system, external_id)
);

-- Normalized Text-bearing Document Index
CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    source_system VARCHAR(50) NOT NULL,
    source_item_id UUID REFERENCES source_item(id) ON DELETE SET NULL,
    external_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- e.g. 'architecture-overview', 'runbook', 'charter', 'adr', 'kb_article'
    sensitivity VARCHAR(50) DEFAULT 'internal' CHECK (sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
    allowed_roles TEXT[] DEFAULT ARRAY['Developer', 'Architect', 'PM', 'Management', 'Support'],
    author VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    url_mock VARCHAR(500),
    raw_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Document Chunks with Hybrid Full-Text & Vector Support
CREATE TABLE IF NOT EXISTS document_chunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
    embedding vector(1536), -- Standard embedding dimension (OpenAI / Azure text-embedding-3)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_chunk UNIQUE (document_id, chunk_index)
);

-- Source Authority Weights for Evidence Ranking
CREATE TABLE IF NOT EXISTS source_authority (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(50) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    domain_authority_weight FLOAT DEFAULT 1.0,
    operational_authority_weight FLOAT DEFAULT 1.0,
    financial_authority_weight FLOAT DEFAULT 1.0,
    description TEXT,
    CONSTRAINT uq_source_authority UNIQUE (source_system, doc_type)
);

-- Seed Baseline Source Authority Weights
INSERT INTO source_authority (source_system, doc_type, domain_authority_weight, operational_authority_weight, financial_authority_weight, description)
VALUES
    ('servicenow', 'sn_incident', 0.8, 1.0, 0.2, 'High authority for operational outages, SLAs and incidents'),
    ('servicenow', 'sn_change', 0.8, 0.95, 0.3, 'Authoritative record of system modifications and CAB signoff'),
    ('servicenow', 'sn_operational_readiness', 0.9, 1.0, 0.4, 'Authoritative evaluation of DR, backup and monitoring status'),
    ('sharepoint', 'Charter', 1.0, 0.3, 1.0, 'Authoritative record of business case, sponsor and initial capex/opex budget'),
    ('sharepoint', 'Runbook', 0.9, 0.95, 0.1, 'Step-by-step incident remediation and escalation instructions'),
    ('confluence', 'architecture-overview', 1.0, 0.6, 0.3, 'Core solution design and architecture topology'),
    ('confluence', 'adr', 1.0, 0.5, 0.2, 'Formal record of architectural decisions and rationale'),
    ('github', 'gh_file', 0.9, 0.9, 0.1, 'Ground-truth configuration files (Docker, Helm, manifests)'),
    ('github', 'gh_dependency', 0.95, 0.8, 0.1, 'Actual runtime and build dependencies and CVEs'),
    ('leanix', 'lx_application', 1.0, 0.7, 0.8, 'Official enterprise architecture registry and TIME classification'),
    ('jira', 'jira_issue', 0.7, 0.8, 0.4, 'Active delivery tasks, blockers and sprint progress')
ON CONFLICT (source_system, doc_type) DO UPDATE SET
    domain_authority_weight = EXCLUDED.domain_authority_weight,
    operational_authority_weight = EXCLUDED.operational_authority_weight,
    financial_authority_weight = EXCLUDED.financial_authority_weight;

-- Indexes for Knowledge & Vector Search
CREATE INDEX IF NOT EXISTS idx_doc_project ON document(project_id);
CREATE INDEX IF NOT EXISTS idx_doc_source ON document(source_system);
CREATE INDEX IF NOT EXISTS idx_doc_sensitivity ON document(sensitivity);
CREATE INDEX IF NOT EXISTS idx_chunk_tsv ON document_chunk USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_chunk_project ON document_chunk(project_id);

-- HNSW Vector Index (Cosine Distance)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_chunk_vector_hnsw 
        ON document_chunk USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Vector extension index creation skipped or deferred';
END $$;
