-- ============================================================================
-- Migration 003: Layer C — Semantic Graph
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- e.g. 'project', 'person', 'team', 'service', 'domain', 'repo', 'ci'
    natural_key VARCHAR(255) UNIQUE NOT NULL, -- e.g. 'project:P-FIN-01', 'person:PER-001'
    name TEXT NOT NULL,
    project_id VARCHAR(50) REFERENCES project(id) ON DELETE CASCADE,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationship (
    id SERIAL PRIMARY KEY,
    src_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
    rel_type VARCHAR(50) NOT NULL, -- e.g. 'DEPENDS_ON', 'USES_SERVICE', 'MEMBER_OF', 'WORKS_ON'
    dst_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    source_item_id UUID, -- References Layer D source_item if available
    valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMPTZ,
    attributes JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_rel UNIQUE (src_id, rel_type, dst_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_type ON entity(type);
CREATE INDEX IF NOT EXISTS idx_entity_project ON entity(project_id);
CREATE INDEX IF NOT EXISTS idx_rel_src ON relationship(src_id);
CREATE INDEX IF NOT EXISTS idx_rel_dst ON relationship(dst_id);
CREATE INDEX IF NOT EXISTS idx_rel_type ON relationship(rel_type);

-- Stored Procedure to Rebuild Knowledge Graph from Master & Typed Layers
CREATE OR REPLACE FUNCTION rebuild_graph()
RETURNS jsonb AS $$
DECLARE
    v_entity_count INT := 0;
    v_rel_count INT := 0;
BEGIN
    -- 1. Ingest Entities from Layer A
    -- Domains
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'domain', 'domain:' || id, name, NULL, jsonb_build_object('description', description)
    FROM domain
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- Platforms
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'platform', 'platform:' || id, name, NULL, jsonb_build_object('vendor', vendor)
    FROM platform
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- Platform Services
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'service', 'service:' || id, name, NULL, jsonb_build_object('platform_id', platform_id, 'tier', tier)
    FROM platform_service
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- Teams
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'team', 'team:' || id, name, NULL, jsonb_build_object('type', type, 'domain_id', domain_id)
    FROM team
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- People
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'person', 'person:' || id, name, NULL, jsonb_build_object('email', email, 'job_title', job_title, 'location', location, 'role_type', role_type)
    FROM person
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- Initiatives
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'initiative', 'initiative:' || id, name, NULL, jsonb_build_object('theme', theme, 'status', status)
    FROM initiative
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- Projects
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'project', 'project:' || id, name, id, jsonb_build_object('domain_id', domain_id, 'status', status, 'criticality', business_criticality, 'rag', rag_status)
    FROM project
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, project_id = EXCLUDED.project_id, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- GitHub Repos
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'repo', 'repo:' || id, name, project_id, jsonb_build_object('primary_language', primary_language)
    FROM gh_repo
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, project_id = EXCLUDED.project_id, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- ServiceNow CIs
    INSERT INTO entity (type, natural_key, name, project_id, attributes)
    SELECT 'ci', 'ci:' || id, name, project_id, jsonb_build_object('ci_class', ci_class, 'environment', environment)
    FROM sn_ci
    ON CONFLICT (natural_key) DO UPDATE SET name = EXCLUDED.name, project_id = EXCLUDED.project_id, attributes = EXCLUDED.attributes, updated_at = CURRENT_TIMESTAMP;

    -- 2. Build Relationships
    -- Project -> Domain (BELONGS_TO)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT p_ent.id, 'BELONGS_TO', d_ent.id, 1.0
    FROM project p
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || p.id
    JOIN entity d_ent ON d_ent.natural_key = 'domain:' || p.domain_id
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    -- Team -> Domain (BELONGS_TO)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT t_ent.id, 'BELONGS_TO', d_ent.id, 1.0
    FROM team t
    JOIN entity t_ent ON t_ent.natural_key = 'team:' || t.id
    JOIN entity d_ent ON d_ent.natural_key = 'domain:' || t.domain_id
    WHERE t.domain_id IS NOT NULL
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    -- Person -> Team (MEMBER_OF)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT per_ent.id, 'MEMBER_OF', t_ent.id, 1.0
    FROM team_member tm
    JOIN entity per_ent ON per_ent.natural_key = 'person:' || tm.person_id
    JOIN entity t_ent ON t_ent.natural_key = 'team:' || tm.team_id
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    -- Person -> Project (WORKS_ON)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight, attributes)
    SELECT per_ent.id, 'WORKS_ON', p_ent.id, (pp.allocation_pct / 100.0), jsonb_build_object('role', pp.role, 'raci', pp.raci_role, 'allocation_pct', pp.allocation_pct)
    FROM project_person pp
    JOIN entity per_ent ON per_ent.natural_key = 'person:' || pp.person_id
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || pp.project_id
    ON CONFLICT (src_id, rel_type, dst_id) DO UPDATE SET weight = EXCLUDED.weight, attributes = EXCLUDED.attributes;

    -- Project -> Project (DEPENDS_ON)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight, attributes)
    SELECT c_ent.id, 'DEPENDS_ON', p_ent.id, CASE WHEN pd.criticality = 'Critical' THEN 1.0 WHEN pd.criticality = 'High' THEN 0.8 ELSE 0.5 END, jsonb_build_object('type', pd.type, 'criticality', pd.criticality, 'description', pd.description)
    FROM project_dependency pd
    JOIN entity c_ent ON c_ent.natural_key = 'project:' || pd.consumer_id
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || pd.provider_id
    ON CONFLICT (src_id, rel_type, dst_id) DO UPDATE SET weight = EXCLUDED.weight, attributes = EXCLUDED.attributes;

    -- Service -> Service (DEPENDS_ON)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight, attributes)
    SELECT c_ent.id, 'DEPENDS_ON', p_ent.id, 0.9, jsonb_build_object('dependency_type', sd.dependency_type, 'criticality', sd.criticality)
    FROM service_dependency sd
    JOIN entity c_ent ON c_ent.natural_key = 'service:' || sd.consumer_service_id
    JOIN entity p_ent ON p_ent.natural_key = 'service:' || sd.provider_service_id
    ON CONFLICT (src_id, rel_type, dst_id) DO UPDATE SET weight = EXCLUDED.weight, attributes = EXCLUDED.attributes;

    -- Project -> Service (USES_SERVICE)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight, attributes)
    SELECT p_ent.id, 'USES_SERVICE', s_ent.id, 1.0, jsonb_build_object('purpose', psu.purpose, 'criticality', psu.criticality)
    FROM project_service_usage psu
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || psu.project_id
    JOIN entity s_ent ON s_ent.natural_key = 'service:' || psu.service_id
    ON CONFLICT (src_id, rel_type, dst_id) DO UPDATE SET weight = EXCLUDED.weight, attributes = EXCLUDED.attributes;

    -- Project -> Initiative (TAGGED_WITH_INITIATIVE)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT p_ent.id, 'TAGGED_WITH_INITIATIVE', init_ent.id, 1.0
    FROM project_initiative pi
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || pi.project_id
    JOIN entity init_ent ON init_ent.natural_key = 'initiative:' || pi.initiative_id
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    -- Project -> GitHub Repo (HAS_REPO)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT p_ent.id, 'HAS_REPO', r_ent.id, 1.0
    FROM gh_repo r
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || r.project_id
    JOIN entity r_ent ON r_ent.natural_key = 'repo:' || r.id
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    -- Project -> ServiceNow CI (REGISTERS_CI)
    INSERT INTO relationship (src_id, rel_type, dst_id, weight)
    SELECT p_ent.id, 'REGISTERS_CI', ci_ent.id, 1.0
    FROM sn_ci ci
    JOIN entity p_ent ON p_ent.natural_key = 'project:' || ci.project_id
    JOIN entity ci_ent ON ci_ent.natural_key = 'ci:' || ci.id
    ON CONFLICT (src_id, rel_type, dst_id) DO NOTHING;

    SELECT COUNT(*) INTO v_entity_count FROM entity;
    SELECT COUNT(*) INTO v_rel_count FROM relationship;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'entities_rebuilt', v_entity_count,
        'relationships_rebuilt', v_rel_count,
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;
