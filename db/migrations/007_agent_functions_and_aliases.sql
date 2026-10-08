-- ============================================================================
-- Migration 007: Agent SQL Functions, Entity Aliases & Optimized Retrieval
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Entity Aliases Table
CREATE TABLE IF NOT EXISTS entity_alias (
    id SERIAL PRIMARY KEY,
    alias TEXT NOT NULL,
    entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    project_id VARCHAR(50),
    CONSTRAINT uq_entity_alias UNIQUE (alias, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_alias_trgm ON entity_alias USING GIN (alias gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_entity_alias_lower ON entity_alias (LOWER(alias));
CREATE INDEX IF NOT EXISTS idx_entity_alias_entity ON entity_alias (entity_id);

-- 2. GitHub Contributor Table
CREATE TABLE IF NOT EXISTS gh_contributor (
    id SERIAL PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    person_id VARCHAR(50) NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    commits_count INT DEFAULT 1,
    role VARCHAR(50) DEFAULT 'Contributor',
    CONSTRAINT uq_gh_contributor UNIQUE (repo_id, person_id)
);

-- Seed Entity Aliases Procedure
CREATE OR REPLACE FUNCTION seed_entity_aliases()
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- Projects (ID, Name, Clean ID)
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT p.id, e.id, 'project', p.id
    FROM project p
    JOIN entity e ON e.natural_key = 'project:' || p.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT p.name, e.id, 'project', p.id
    FROM project p
    JOIN entity e ON e.natural_key = 'project:' || p.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- Jira Keys (e.g. FIN1, CYB1)
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT jp.key, e.id, 'project', jp.project_id
    FROM jira_project jp
    JOIN entity e ON e.natural_key = 'project:' || jp.project_id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- People (Names, IDs, Emails)
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT p.name, e.id, 'person', NULL
    FROM person p
    JOIN entity e ON e.natural_key = 'person:' || p.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT p.id, e.id, 'person', NULL
    FROM person p
    JOIN entity e ON e.natural_key = 'person:' || p.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- Teams (Names, IDs)
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT t.name, e.id, 'team', NULL
    FROM team t
    JOIN entity e ON e.natural_key = 'team:' || t.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT t.id, e.id, 'team', NULL
    FROM team t
    JOIN entity e ON e.natural_key = 'team:' || t.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- Platform Services (Names, IDs)
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT ps.name, e.id, 'service', NULL
    FROM platform_service ps
    JOIN entity e ON e.natural_key = 'service:' || ps.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT ps.id, e.id, 'service', NULL
    FROM platform_service ps
    JOIN entity e ON e.natural_key = 'service:' || ps.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- Domains
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT d.name, e.id, 'domain', NULL
    FROM domain d
    JOIN entity e ON e.natural_key = 'domain:' || d.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT d.id, e.id, 'domain', NULL
    FROM domain d
    JOIN entity e ON e.natural_key = 'domain:' || d.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    -- GitHub Repos
    INSERT INTO entity_alias (alias, entity_id, entity_type, project_id)
    SELECT r.name, e.id, 'repo', r.project_id
    FROM gh_repo r
    JOIN entity e ON e.natural_key = 'repo:' || r.id
    ON CONFLICT (alias, entity_id) DO NOTHING;

    SELECT COUNT(*) INTO v_count FROM entity_alias;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 3. SQL FUNCTION a: resolve_entities(text)
CREATE OR REPLACE FUNCTION resolve_entities(p_text TEXT)
RETURNS TABLE (
    entity_id UUID,
    natural_key VARCHAR,
    entity_type VARCHAR,
    entity_name TEXT,
    project_id VARCHAR,
    match_score FLOAT,
    matched_alias TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_matches AS (
        SELECT 
            ea.entity_id,
            e.natural_key,
            e.type AS entity_type,
            e.name AS entity_name,
            e.project_id,
            ea.alias AS matched_alias,
            CASE 
                WHEN LOWER(p_text) ~* ('\y' || LOWER(ea.alias) || '\y') THEN 1.0::FLOAT
                WHEN LOWER(p_text) LIKE ('%' || LOWER(ea.alias) || '%') THEN 0.85::FLOAT
                ELSE similarity(ea.alias, p_text)::FLOAT
            END AS score
        FROM entity_alias ea
        JOIN entity e ON e.id = ea.entity_id
        WHERE 
            similarity(ea.alias, p_text) > 0.25
            OR LOWER(p_text) LIKE ('%' || LOWER(ea.alias) || '%')
    )
    SELECT DISTINCT ON (sm.entity_id)
        sm.entity_id,
        sm.natural_key,
        sm.entity_type,
        sm.entity_name,
        sm.project_id,
        sm.score AS match_score,
        sm.matched_alias
    FROM scored_matches sm
    ORDER BY sm.entity_id, sm.score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. SQL FUNCTION b: graph_neighbors(entity_id, max_hops, rel_types, min_criticality)
CREATE OR REPLACE FUNCTION graph_neighbors(
    p_entity_id UUID,
    p_max_hops INT DEFAULT 2,
    p_rel_types VARCHAR[] DEFAULT NULL,
    p_min_criticality VARCHAR DEFAULT 'Low'
)
RETURNS TABLE (
    hop INT,
    rel_type VARCHAR,
    target_entity_id UUID,
    target_name TEXT,
    target_type VARCHAR,
    target_project_id VARCHAR,
    criticality VARCHAR,
    path_names TEXT[]
) AS $$
DECLARE
    v_hops INT := LEAST(COALESCE(p_max_hops, 2), 4);
BEGIN
    RETURN QUERY
    WITH RECURSIVE neighbor_tree AS (
        -- Anchor member (hop 1)
        SELECT 
            1 AS hop,
            r.rel_type,
            r.dst_id AS target_id,
            e_dst.name AS target_name,
            e_dst.type AS target_type,
            e_dst.project_id AS target_project_id,
            COALESCE(r.attributes->>'criticality', 'Medium') AS criticality,
            ARRAY[e_src.name, e_dst.name]::TEXT[] AS path_names,
            ARRAY[r.src_id, r.dst_id]::UUID[] AS visited_nodes
        FROM relationship r
        JOIN entity e_src ON e_src.id = r.src_id
        JOIN entity e_dst ON e_dst.id = r.dst_id
        WHERE r.src_id = p_entity_id
          AND (p_rel_types IS NULL OR r.rel_type = ANY(p_rel_types))
        
        UNION ALL
        
        -- Recursive member (hop > 1)
        SELECT 
            nt.hop + 1,
            r.rel_type,
            r.dst_id AS target_id,
            e_dst.name AS target_name,
            e_dst.type AS target_type,
            e_dst.project_id AS target_project_id,
            COALESCE(r.attributes->>'criticality', 'Medium') AS criticality,
            nt.path_names || e_dst.name,
            nt.visited_nodes || r.dst_id
        FROM relationship r
        JOIN neighbor_tree nt ON nt.target_id = r.src_id
        JOIN entity e_dst ON e_dst.id = r.dst_id
        WHERE nt.hop < v_hops
          AND NOT (r.dst_id = ANY(nt.visited_nodes)) -- Cycle prevention
          AND (p_rel_types IS NULL OR r.rel_type = ANY(p_rel_types))
    )
    SELECT 
        nt.hop,
        nt.rel_type,
        nt.target_id,
        nt.target_name,
        nt.target_type,
        nt.target_project_id,
        nt.criticality,
        nt.path_names
    FROM neighbor_tree nt;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. SQL FUNCTION c: impact_of(entity_id)
CREATE OR REPLACE FUNCTION impact_of(p_entity_id UUID)
RETURNS TABLE (
    impacted_project_id VARCHAR,
    impacted_project_name TEXT,
    impact_level VARCHAR,
    dependency_chain TEXT,
    business_owner TEXT,
    tech_lead TEXT,
    owning_team TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE impact_chain AS (
        -- If entity is platform_service, find directly consuming projects
        SELECT 
            1 AS depth,
            psu.project_id,
            p.name AS proj_name,
            psu.criticality AS impact_crit,
            'Service (' || ps.name || ') -> Project (' || p.name || ')' AS chain,
            ARRAY[r.src_id, r.dst_id] AS visited
        FROM relationship r
        JOIN platform_service ps ON ('service:' || ps.id) = (SELECT natural_key FROM entity WHERE id = p_entity_id)
        JOIN project_service_usage psu ON psu.service_id = ps.id
        JOIN project p ON p.id = psu.project_id
        WHERE psu.criticality IN ('Critical', 'High')

        UNION ALL

        -- If entity is a project, find downstream projects that consume it
        SELECT 
            1 AS depth,
            pd.consumer_id,
            p.name AS proj_name,
            pd.criticality AS impact_crit,
            'Project (' || prov.name || ') -> Consumer (' || p.name || ')' AS chain,
            ARRAY[e_prov.id, e_cons.id] AS visited
        FROM project_dependency pd
        JOIN entity e_prov ON e_prov.natural_key = 'project:' || pd.provider_id
        JOIN entity e_cons ON e_cons.natural_key = 'project:' || pd.consumer_id
        JOIN project prov ON prov.id = pd.provider_id
        JOIN project p ON p.id = pd.consumer_id
        WHERE e_prov.id = p_entity_id
          AND pd.criticality IN ('Critical', 'High')

        UNION ALL

        -- Transitive impact (downstream of downstream)
        SELECT 
            ic.depth + 1,
            pd.consumer_id,
            p.name AS proj_name,
            pd.criticality AS impact_crit,
            ic.chain || ' -> Consumer (' || p.name || ')',
            ic.visited || e_cons.id
        FROM project_dependency pd
        JOIN impact_chain ic ON ic.project_id = pd.provider_id
        JOIN project p ON p.id = pd.consumer_id
        JOIN entity e_cons ON e_cons.natural_key = 'project:' || pd.consumer_id
        WHERE ic.depth < 3
          AND pd.criticality IN ('Critical', 'High')
          AND NOT (e_cons.id = ANY(ic.visited))
    )
    SELECT DISTINCT ON (ic.project_id)
        ic.project_id AS impacted_project_id,
        ic.proj_name AS impacted_project_name,
        ic.impact_crit AS impact_level,
        ic.chain AS dependency_chain,
        bo.name AS business_owner,
        tl.name AS tech_lead,
        t.name AS owning_team
    FROM impact_chain ic
    JOIN project p ON p.id = ic.project_id
    LEFT JOIN person bo ON bo.id = p.business_owner_id
    LEFT JOIN person tl ON tl.id = p.tech_lead_id
    LEFT JOIN team t ON t.id = p.department_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. SQL FUNCTION d: project_context(project_id, role, person_id)
CREATE OR REPLACE FUNCTION project_context(
    p_project_id VARCHAR,
    p_role VARCHAR DEFAULT 'Developer',
    p_person_id VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_is_mgmt BOOLEAN := (p_role IN ('Management', 'PM', 'Architect'));
BEGIN
    SELECT jsonb_build_object(
        'project', (
            SELECT jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'domain_id', p.domain_id,
                'status', p.status,
                'phase', p.phase,
                'business_criticality', p.business_criticality,
                'rag_status', p.rag_status,
                'planned_start', p.planned_start,
                'planned_end', p.planned_end,
                'go_live_date', p.go_live_date,
                'summary', p.summary,
                'business_owner', jsonb_build_object('id', bo.id, 'name', bo.name, 'email', bo.email),
                'tech_lead', jsonb_build_object('id', tl.id, 'name', tl.name, 'email', tl.email)
            )
            FROM project p
            LEFT JOIN person bo ON bo.id = p.business_owner_id
            LEFT JOIN person tl ON tl.id = p.tech_lead_id
            WHERE p.id = p_project_id
        ),
        'team_raci', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'person_id', pp.person_id,
                'name', per.name,
                'role', pp.role,
                'raci_role', pp.raci_role,
                'allocation_pct', pp.allocation_pct
            )), '[]'::jsonb)
            FROM project_person pp
            JOIN person per ON per.id = pp.person_id
            WHERE pp.project_id = p_project_id
        ),
        'budget', CASE 
            WHEN v_is_mgmt THEN (
                SELECT jsonb_build_object(
                    'cost_center', pb.cost_center_code,
                    'capex_planned', pb.capex_planned,
                    'opex_planned', pb.opex_planned,
                    'actual_ytd', pb.actual_ytd,
                    'variance', pb.variance
                )
                FROM project_budget pb
                WHERE pb.project_id = p_project_id AND pb.fiscal_year = 2026
            )
            ELSE jsonb_build_object('status', 'RESTRICTED_BY_ROLE')
        END,
        'initiatives', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', init.id,
                'name', init.name,
                'theme', init.theme
            )), '[]'::jsonb)
            FROM project_initiative pi
            JOIN initiative init ON init.id = pi.initiative_id
            WHERE pi.project_id = p_project_id
        ),
        'services_used', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'service_id', psu.service_id,
                'name', ps.name,
                'platform', ps.platform_id,
                'purpose', psu.purpose,
                'criticality', psu.criticality
            )), '[]'::jsonb)
            FROM project_service_usage psu
            JOIN platform_service ps ON ps.id = psu.service_id
            WHERE psu.project_id = p_project_id
        ),
        'dependencies', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'provider_id', pd.provider_id,
                'provider_name', prov.name,
                'type', pd.type,
                'criticality', pd.criticality,
                'description', pd.description
            )), '[]'::jsonb)
            FROM project_dependency pd
            JOIN project prov ON prov.id = pd.provider_id
            WHERE pd.consumer_id = p_project_id
        ),
        'open_incidents', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', inc.id,
                'priority', inc.priority,
                'state', inc.state,
                'short_description', inc.short_description,
                'opened_at', inc.opened_at
            )), '[]'::jsonb)
            FROM sn_incident inc
            WHERE inc.project_id = p_project_id AND inc.state IN ('New', 'Open', 'In Progress')
        ),
        'repositories', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'language', r.primary_language,
                'default_branch', r.default_branch
            )), '[]'::jsonb)
            FROM gh_repo r
            WHERE r.project_id = p_project_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. SQL FUNCTION e: hybrid_search(query_text, query_embedding, project_ids, role, person_id, k)
CREATE OR REPLACE FUNCTION hybrid_search(
    p_query_text TEXT,
    p_query_embedding vector(1536) DEFAULT NULL,
    p_project_ids VARCHAR[] DEFAULT NULL,
    p_role VARCHAR DEFAULT 'Developer',
    p_person_id VARCHAR DEFAULT NULL,
    p_k INT DEFAULT 8
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    project_id VARCHAR,
    title VARCHAR,
    doc_type VARCHAR,
    source_system VARCHAR,
    source_item_id UUID,
    chunk_text TEXT,
    rank_score FLOAT,
    vector_score FLOAT,
    fts_score FLOAT,
    authority_weight FLOAT
) AS $$
DECLARE
    v_has_vec BOOLEAN := (p_query_embedding IS NOT NULL);
BEGIN
    RETURN QUERY
    WITH visible_docs AS (
        SELECT v.document_id, v.project_id, v.title, v.doc_type, v.source_system, v.updated_at
        FROM visible_documents(p_role, p_person_id) v
        WHERE (p_project_ids IS NULL OR v.project_id = ANY(p_project_ids))
    ),
    fts_ranked AS (
        SELECT 
            dc.id AS c_id,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.tsv, plainto_tsquery('english', p_query_text)) DESC) AS fts_rank,
            ts_rank_cd(dc.tsv, plainto_tsquery('english', p_query_text))::FLOAT AS raw_fts_score
        FROM document_chunk dc
        JOIN visible_docs vd ON vd.document_id = dc.document_id
        WHERE dc.tsv @@ plainto_tsquery('english', p_query_text)
        LIMIT 50
    ),
    vec_ranked AS (
        SELECT 
            dc.id AS c_id,
            ROW_NUMBER() OVER (ORDER BY dc.embedding <=> p_query_embedding ASC) AS vec_rank,
            (1.0 - (dc.embedding <=> p_query_embedding))::FLOAT AS raw_vec_score
        FROM document_chunk dc
        JOIN visible_docs vd ON vd.document_id = dc.document_id
        WHERE v_has_vec AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> p_query_embedding ASC
        LIMIT 50
    ),
    combined AS (
        SELECT 
            COALESCE(f.c_id, v.c_id) AS c_id,
            COALESCE(1.0 / (60.0 + f.fts_rank), 0.0) AS fts_rrf,
            COALESCE(1.0 / (60.0 + v.vec_rank), 0.0) AS vec_rrf,
            COALESCE(f.raw_fts_score, 0.0) AS fts_score,
            COALESCE(v.raw_vec_score, 0.0) AS vec_score
        FROM fts_ranked f
        FULL OUTER JOIN vec_ranked v ON v.c_id = f.c_id
    )
    SELECT 
        dc.id AS chunk_id,
        dc.document_id,
        dc.project_id,
        vd.title,
        vd.doc_type,
        vd.source_system,
        d.source_item_id,
        dc.chunk_text,
        -- Weighted RRF Score + Authority Weight + Freshness factor
        ( (c.fts_rrf * 0.5 + c.vec_rrf * 0.5) * COALESCE(sa.operational_authority_weight, 1.0) )::FLOAT AS rank_score,
        c.vec_score AS vector_score,
        c.fts_score AS fts_score,
        COALESCE(sa.operational_authority_weight, 1.0)::FLOAT AS authority_weight
    FROM combined c
    JOIN document_chunk dc ON dc.id = c.c_id
    JOIN visible_docs vd ON vd.document_id = dc.document_id
    JOIN document d ON d.id = dc.document_id
    LEFT JOIN source_authority sa ON sa.source_system = vd.source_system AND sa.doc_type = vd.doc_type
    ORDER BY rank_score DESC
    LIMIT p_k;
END;
$$ LANGUAGE plpgsql STABLE;
