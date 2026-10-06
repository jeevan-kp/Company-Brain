-- ============================================================================
-- Company Brain — Semantic Knowledge Layer Schema
-- PostgreSQL 17 + pgvector
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- PROJECTS — The central organizing unit
-- ============================================================================
CREATE TABLE projects (
    project_id    TEXT PRIMARY KEY,                -- e.g., 'ATLAS'
    name          TEXT NOT NULL,
    aliases       TEXT[] DEFAULT '{}',             -- alternative names for resolution
    department    TEXT NOT NULL,
    domain        TEXT NOT NULL,
    team          TEXT,
    project_owner_role TEXT,
    business_objective TEXT,
    business_value TEXT,
    kpis          JSONB DEFAULT '[]',
    status        TEXT DEFAULT 'active',           -- active / on-hold / completed
    start_date    DATE,
    target_date   DATE,
    lifecycle_phase TEXT,                          -- planning / build / test / deploy / operate
    applications  JSONB DEFAULT '[]',
    interfaces    JSONB DEFAULT '[]',
    dependencies  JSONB DEFAULT '[]',
    milestones    JSONB DEFAULT '[]',
    jira_epic_keys TEXT[] DEFAULT '{}',
    blockers      JSONB DEFAULT '[]',
    risks         JSONB DEFAULT '[]',
    decisions     JSONB DEFAULT '[]',
    decision_log_url TEXT,
    documents     JSONB DEFAULT '[]',
    approvals     JSONB DEFAULT '[]',
    incidents     JSONB DEFAULT '[]',
    changes       JSONB DEFAULT '[]',
    releases      JSONB DEFAULT '[]',
    support_owner TEXT,
    monitoring_owner TEXT,
    runbooks      JSONB DEFAULT '[]',
    security_classification TEXT DEFAULT 'Internal', -- Public / Internal / Confidential / Secret
    allowed_roles TEXT[] DEFAULT '{project_manager,architect,developer,support}',
    authority_level TEXT DEFAULT 'operational',
    source_updated_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    confidence    REAL DEFAULT 1.0,
    expected_questions TEXT[] DEFAULT '{}',
    expected_answers JSONB DEFAULT '[]',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENTITIES — The 12 semantic entity types
-- ============================================================================
CREATE TABLE entities (
    entity_id     TEXT PRIMARY KEY,                -- e.g., 'APPLICATION:ORDER-HUB'
    entity_type   TEXT NOT NULL,                   -- Project, Department, Domain, Person, Application, Decision, Document, Issue, Release, Meeting, Change, Action
    name          TEXT NOT NULL,
    project_id    TEXT REFERENCES projects(project_id) ON DELETE CASCADE,
    status        TEXT,
    metadata      JSONB DEFAULT '{}',              -- type-specific fields
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_entities_name_trgm ON entities USING gin(name gin_trgm_ops);

-- ============================================================================
-- ENTITY ALIASES — For deduplication and fuzzy resolution
-- ============================================================================
CREATE TABLE entity_aliases (
    alias_id          SERIAL PRIMARY KEY,
    entity_id         TEXT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    source_system     TEXT NOT NULL,               -- jira, confluence, github, leanix, sharepoint, teams, servicenow
    source_identifier TEXT NOT NULL,               -- original ID in source system
    alias_name        TEXT NOT NULL,
    confidence        REAL DEFAULT 1.0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_entity_aliases_unique ON entity_aliases(entity_id, source_system, source_identifier);
CREATE INDEX idx_entity_aliases_source ON entity_aliases(source_system, source_identifier);
CREATE INDEX idx_entity_aliases_name_trgm ON entity_aliases USING gin(alias_name gin_trgm_ops);

-- ============================================================================
-- RELATIONSHIPS — Graph edges between entities
-- ============================================================================
CREATE TABLE relationships (
    rel_id        SERIAL PRIMARY KEY,
    source_entity_id TEXT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    target_entity_id TEXT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,               -- HAS_DOCUMENT, BLOCKS, AFFECTS, IMPLEMENTS, DEPLOYS, APPROVES, etc.
    metadata      JSONB DEFAULT '{}',
    valid_from    TIMESTAMPTZ DEFAULT NOW(),
    valid_to      TIMESTAMPTZ,                     -- NULL = still active
    weight        REAL DEFAULT 1.0,
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rel_source ON relationships(source_entity_id);
CREATE INDEX idx_rel_target ON relationships(target_entity_id);
CREATE INDEX idx_rel_type ON relationships(relationship_type);
CREATE INDEX idx_rel_active ON relationships(active) WHERE active = TRUE;

-- ============================================================================
-- EVIDENCE — Every graph fact must have evidence
-- ============================================================================
CREATE TABLE evidence (
    evidence_id     SERIAL PRIMARY KEY,
    entity_id       TEXT REFERENCES entities(entity_id) ON DELETE CASCADE,
    rel_id          INTEGER REFERENCES relationships(rel_id) ON DELETE CASCADE,
    source_item_id  TEXT NOT NULL,                  -- FK to source_items
    statements      TEXT NOT NULL,                  -- the claim / fact text
    authority       TEXT NOT NULL DEFAULT 'operational', -- governance / architectural / operational / informal
    confidence      REAL NOT NULL DEFAULT 0.8,
    allowed_roles   TEXT[] DEFAULT '{project_manager,architect,developer,support}',
    observed_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT evidence_target CHECK (entity_id IS NOT NULL OR rel_id IS NOT NULL)
);

CREATE INDEX idx_evidence_entity ON evidence(entity_id);
CREATE INDEX idx_evidence_rel ON evidence(rel_id);
CREATE INDEX idx_evidence_source ON evidence(source_item_id);
CREATE INDEX idx_evidence_authority ON evidence(authority);

-- ============================================================================
-- SOURCE ITEMS — Raw normalized records from each adapter
-- ============================================================================
CREATE TABLE source_items (
    source_item_id    TEXT PRIMARY KEY,             -- e.g., 'jira:ATL-8'
    source_system     TEXT NOT NULL,                -- jira, confluence, github, leanix, sharepoint, teams, servicenow
    source_record_id  TEXT NOT NULL,                -- original ID in source
    source_url        TEXT,
    record_type       TEXT NOT NULL,                -- issue, page, repo, application, document, message, incident, change
    project_id        TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
    content           JSONB NOT NULL,               -- the normalized record content
    content_hash      TEXT NOT NULL,                -- SHA256 of content for diff
    source_created_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    ingested_at       TIMESTAMPTZ DEFAULT NOW(),
    classification    TEXT DEFAULT 'Internal',
    allowed_roles     TEXT[] DEFAULT '{project_manager,architect,developer,support}',
    raw_payload       JSONB,                        -- original source payload for traceability
    active            BOOLEAN DEFAULT TRUE,
    version           INTEGER DEFAULT 1
);

CREATE INDEX idx_source_items_system ON source_items(source_system);
CREATE INDEX idx_source_items_project ON source_items(project_id);
CREATE INDEX idx_source_items_hash ON source_items(content_hash);
CREATE INDEX idx_source_items_record_type ON source_items(record_type);

-- ============================================================================
-- USERS & ROLES — For permission-aware access
-- ============================================================================
CREATE TABLE users (
    user_id       TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT,
    roles         JSONB DEFAULT '[]',               -- [{role_name, project_ids}]
    persona       TEXT DEFAULT 'developer',         -- management, project_manager, developer, support, architect
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    role_id       TEXT PRIMARY KEY,
    role_name     TEXT NOT NULL,
    description   TEXT,
    permissions   JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYNC RUNS — Track ingestion history
-- ============================================================================
CREATE TABLE sync_runs (
    run_id        SERIAL PRIMARY KEY,
    trigger       TEXT NOT NULL,                    -- 'scheduled' / 'manual' / 'webhook'
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    status        TEXT DEFAULT 'running',           -- running / completed / failed
    counts        JSONB DEFAULT '{}',               -- {adapter: {fetched, new, updated, unchanged}}
    errors        JSONB DEFAULT '[]'
);

-- ============================================================================
-- READINESS RESULTS — Deterministic readiness scoring
-- ============================================================================
CREATE TABLE readiness_results (
    result_id     SERIAL PRIMARY KEY,
    project_id    TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    run_id        INTEGER REFERENCES sync_runs(run_id),
    readiness     TEXT NOT NULL,                    -- READY / CONDITIONALLY_READY / NOT_READY
    score         REAL NOT NULL,                    -- 0.0 to 1.0
    rules         JSONB NOT NULL DEFAULT '[]',      -- [{rule_name, passed, severity, evidence_ids}]
    evaluated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readiness_project ON readiness_results(project_id);
CREATE INDEX idx_readiness_latest ON readiness_results(project_id, evaluated_at DESC);

-- ============================================================================
-- CONFLICTS — Cross-source contradiction detection
-- ============================================================================
CREATE TABLE conflicts (
    conflict_id     SERIAL PRIMARY KEY,
    conflict_type   TEXT NOT NULL,                  -- architecture_vs_implementation, decision_vs_discussion, documented_vs_actual
    project_id      TEXT REFERENCES projects(project_id) ON DELETE CASCADE,
    entity_a_id     TEXT REFERENCES entities(entity_id) ON DELETE SET NULL,
    entity_b_id     TEXT REFERENCES entities(entity_id) ON DELETE SET NULL,
    evidence_a_id   INTEGER REFERENCES evidence(evidence_id) ON DELETE SET NULL,
    evidence_b_id   INTEGER REFERENCES evidence(evidence_id) ON DELETE SET NULL,
    description     TEXT NOT NULL,
    severity        TEXT NOT NULL DEFAULT 'warning', -- critical / warning / info
    status          TEXT DEFAULT 'open',             -- open / resolved / dismissed
    recommended_action TEXT,
    detected_at     TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_conflicts_project ON conflicts(project_id);
CREATE INDEX idx_conflicts_status ON conflicts(status);

-- ============================================================================
-- SOURCE BINDINGS — Connect projects to source system accounts
-- ============================================================================
CREATE TABLE source_bindings (
    binding_id    SERIAL PRIMARY KEY,
    project_id    TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    source_system TEXT NOT NULL,
    external_key  TEXT NOT NULL,                    -- e.g., Jira project key, GitHub repo name
    metadata      JSONB DEFAULT '{}',               -- e.g., {confluence_space: "ATL", github_repository: "project-atlas-integration"}
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_source_bindings_unique ON source_bindings(project_id, source_system, external_key);

-- ============================================================================
-- VECTOR EMBEDDINGS — For semantic search (pgvector)
-- ============================================================================
CREATE TABLE embeddings (
    embedding_id  SERIAL PRIMARY KEY,
    entity_id     TEXT REFERENCES entities(entity_id) ON DELETE CASCADE,
    source_item_id TEXT REFERENCES source_items(source_item_id) ON DELETE CASCADE,
    content_text  TEXT NOT NULL,
    embedding     vector(1536),                     -- OpenAI ada-002 / compatible dimension
    model         TEXT DEFAULT 'text-embedding-ada-002',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT embedding_target CHECK (entity_id IS NOT NULL OR source_item_id IS NOT NULL)
);

CREATE INDEX idx_embeddings_entity ON embeddings(entity_id);
CREATE INDEX idx_embeddings_source ON embeddings(source_item_id);
-- HNSW index for fast similarity search
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Latest readiness per project
CREATE OR REPLACE VIEW v_latest_readiness AS
SELECT DISTINCT ON (project_id)
    project_id,
    readiness,
    score,
    rules,
    evaluated_at
FROM readiness_results
ORDER BY project_id, evaluated_at DESC;

-- View: Active conflicts
CREATE OR REPLACE VIEW v_active_conflicts AS
SELECT
    c.*,
    p.name AS project_name,
    p.department
FROM conflicts c
JOIN projects p ON c.project_id = p.project_id
WHERE c.status = 'open';

-- View: Entity with evidence count
CREATE OR REPLACE VIEW v_entity_evidence AS
SELECT
    e.entity_id,
    e.entity_type,
    e.name,
    e.project_id,
    COUNT(ev.evidence_id) AS evidence_count,
    MAX(ev.observed_at) AS latest_evidence
FROM entities e
LEFT JOIN evidence ev ON e.entity_id = ev.entity_id
GROUP BY e.entity_id, e.entity_type, e.name, e.project_id;

-- View: Source freshness per project
CREATE OR REPLACE VIEW v_source_freshness AS
SELECT
    sb.project_id,
    sb.source_system,
    COUNT(si.source_item_id) AS record_count,
    MAX(si.source_updated_at) AS last_source_update,
    MAX(si.ingested_at) AS last_ingested
FROM source_bindings sb
LEFT JOIN source_items si ON sb.project_id = si.project_id AND sb.source_system = si.source_system
WHERE sb.active = TRUE
GROUP BY sb.project_id, sb.source_system;

-- ============================================================================
-- RECURSIVE CTE FUNCTION — Graph traversal
-- ============================================================================
CREATE OR REPLACE FUNCTION get_subgraph(
    p_entity_id TEXT,
    p_max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
    entity_id TEXT,
    entity_type TEXT,
    name TEXT,
    depth INTEGER,
    path TEXT[]
) AS $$
WITH RECURSIVE graph_walk AS (
    -- Base case: starting entity
    SELECT
        e.entity_id,
        e.entity_type,
        e.name,
        0 AS depth,
        ARRAY[e.entity_id] AS path
    FROM entities e
    WHERE e.entity_id = p_entity_id

    UNION ALL

    -- Recursive: follow relationships
    SELECT
        e2.entity_id,
        e2.entity_type,
        e2.name,
        gw.depth + 1,
        gw.path || e2.entity_id
    FROM graph_walk gw
    JOIN relationships r ON (
        r.source_entity_id = gw.entity_id OR r.target_entity_id = gw.entity_id
    )
    JOIN entities e2 ON (
        CASE
            WHEN r.source_entity_id = gw.entity_id THEN r.target_entity_id
            ELSE r.source_entity_id
        END = e2.entity_id
    )
    WHERE gw.depth < p_max_depth
      AND r.active = TRUE
      AND NOT e2.entity_id = ANY(gw.path)  -- prevent cycles
)
SELECT DISTINCT ON (gw.entity_id)
    gw.entity_id,
    gw.entity_type,
    gw.name,
    gw.depth,
    gw.path
FROM graph_walk gw
ORDER BY gw.entity_id, gw.depth;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- FUNCTION: Get project readiness with evidence
-- ============================================================================
CREATE OR REPLACE FUNCTION get_project_readiness_detail(p_project_id TEXT)
RETURNS JSONB AS $$
SELECT jsonb_build_object(
    'project_id', p.project_id,
    'project_name', p.name,
    'department', p.department,
    'readiness', COALESCE(r.readiness, 'NOT_EVALUATED'),
    'score', COALESCE(r.score, 0),
    'rules', COALESCE(r.rules, '[]'::jsonb),
    'evaluated_at', r.evaluated_at,
    'conflicts', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'conflict_type', c.conflict_type,
            'description', c.description,
            'severity', c.severity
        )), '[]'::jsonb)
        FROM conflicts c
        WHERE c.project_id = p.project_id AND c.status = 'open'
    ),
    'source_freshness', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'source', sf.source_system,
            'records', sf.record_count,
            'last_update', sf.last_source_update,
            'last_ingested', sf.last_ingested
        )), '[]'::jsonb)
        FROM v_source_freshness sf
        WHERE sf.project_id = p.project_id
    )
)
FROM projects p
LEFT JOIN v_latest_readiness r ON p.project_id = r.project_id
WHERE p.project_id = p_project_id;
$$ LANGUAGE SQL STABLE;
