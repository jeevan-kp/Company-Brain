-- ============================================================================
-- Migration 006: Views, Security Functions & Accelerated Join Models
-- ============================================================================

-- 1. Security-Aware Document Visibility Function
CREATE OR REPLACE FUNCTION visible_documents(
    p_role VARCHAR(50) DEFAULT 'Developer',
    p_person_id VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    document_id UUID,
    project_id VARCHAR(50),
    title VARCHAR(500),
    doc_type VARCHAR(50),
    source_system VARCHAR(50),
    sensitivity VARCHAR(50),
    author VARCHAR(255),
    updated_at TIMESTAMPTZ,
    url_mock VARCHAR(500)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id AS document_id,
        d.project_id,
        d.title,
        d.doc_type,
        d.source_system,
        d.sensitivity,
        d.author,
        d.updated_at,
        d.url_mock
    FROM document d
    WHERE 
        -- Role match
        p_role = ANY(d.allowed_roles)
        -- Sensitivity check
        AND (
            d.sensitivity IN ('public', 'internal')
            OR (d.sensitivity = 'confidential' AND p_role IN ('Management', 'PM', 'Architect'))
            OR (d.sensitivity = 'restricted' AND (
                p_role = 'Management' 
                OR (p_person_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM project_person pp 
                    WHERE pp.project_id = d.project_id 
                    AND pp.person_id = p_person_id 
                    AND pp.raci_role IN ('A', 'R', 'Accountable', 'Responsible')
                ))
            ))
        );
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. View: Comprehensive Project Master Summary
CREATE OR REPLACE VIEW v_project_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.code AS project_code,
    d.id AS domain_id,
    d.name AS domain_name,
    p.status,
    p.phase,
    p.priority,
    p.business_criticality,
    p.rag_status,
    p.planned_start,
    p.planned_end,
    p.go_live_date,
    bo.name AS business_owner_name,
    bo.email AS business_owner_email,
    tl.name AS tech_lead_name,
    tl.email AS tech_lead_email,
    pm.name AS project_manager_name,
    pm.email AS project_manager_email,
    COALESCE(pb.capex_planned, 0.00) AS capex_budget,
    COALESCE(pb.opex_planned, 0.00) AS opex_budget,
    COALESCE(pb.actual_ytd, 0.00) AS actual_spend_ytd,
    COALESCE(pb.variance, 0.00) AS budget_variance,
    COUNT(DISTINCT pp.person_id) AS team_headcount,
    COUNT(DISTINCT psu.service_id) AS services_used_count,
    COUNT(DISTINCT pd_in.provider_id) AS upstream_dependencies_count,
    COUNT(DISTINCT pd_out.consumer_id) AS downstream_dependents_count
FROM project p
LEFT JOIN domain d ON d.id = p.domain_id
LEFT JOIN person bo ON bo.id = p.business_owner_id
LEFT JOIN person tl ON tl.id = p.tech_lead_id
LEFT JOIN person pm ON pm.id = p.pm_id
LEFT JOIN project_budget pb ON pb.project_id = p.id AND pb.fiscal_year = 2026
LEFT JOIN project_person pp ON pp.project_id = p.id
LEFT JOIN project_service_usage psu ON psu.project_id = p.id
LEFT JOIN project_dependency pd_in ON pd_in.consumer_id = p.id
LEFT JOIN project_dependency pd_out ON pd_out.provider_id = p.id
GROUP BY 
    p.id, p.name, p.code, d.id, d.name, p.status, p.phase, p.priority, 
    p.business_criticality, p.rag_status, p.planned_start, p.planned_end, 
    p.go_live_date, bo.name, bo.email, tl.name, tl.email, pm.name, pm.email,
    pb.capex_planned, pb.opex_planned, pb.actual_ytd, pb.variance;

-- 3. View: Service Outage Impact Analysis
CREATE OR REPLACE VIEW v_service_impact AS
SELECT 
    ps.id AS service_id,
    ps.name AS service_name,
    plt.name AS platform_name,
    own_t.name AS owning_team_name,
    p.id AS impacted_project_id,
    p.name AS impacted_project_name,
    p.status AS project_status,
    p.business_criticality AS project_criticality,
    psu.criticality AS usage_criticality,
    psu.purpose AS usage_purpose,
    bo.name AS project_business_owner,
    tl.name AS project_tech_lead
FROM platform_service ps
JOIN platform plt ON plt.id = ps.platform_id
LEFT JOIN team own_t ON own_t.id = ps.owner_team_id
JOIN project_service_usage psu ON psu.service_id = ps.id
JOIN project p ON p.id = psu.project_id
LEFT JOIN person bo ON bo.id = p.business_owner_id
LEFT JOIN person tl ON tl.id = p.tech_lead_id;

-- 4. View: Project Operational Health & Governance
CREATE OR REPLACE VIEW v_project_operational_health AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    op.monitoring_enabled,
    op.alerting_configured,
    op.backup_configured,
    op.last_dr_test_date,
    op.on_call_rota_active,
    op.runbook_exists,
    op.health_score,
    COUNT(DISTINCT CASE WHEN inc.priority = 'P1' AND inc.state IN ('New', 'Open', 'In Progress') THEN inc.id END) AS open_p1_incidents,
    COUNT(DISTINCT CASE WHEN inc.priority = 'P2' AND inc.state IN ('New', 'Open', 'In Progress') THEN inc.id END) AS open_p2_incidents,
    COUNT(DISTINCT CASE WHEN chg.state IN ('Scheduled', 'Implementing') THEN chg.id END) AS upcoming_changes_count
FROM project p
LEFT JOIN sn_operational_readiness op ON op.project_id = p.id
LEFT JOIN sn_incident inc ON inc.project_id = p.id
LEFT JOIN sn_change chg ON chg.project_id = p.id
GROUP BY 
    p.id, p.name, p.status, op.monitoring_enabled, op.alerting_configured, 
    op.backup_configured, op.last_dr_test_date, op.on_call_rota_active, 
    op.runbook_exists, op.health_score;

-- 5. View: Cost Center Budget & Variance Tracking
CREATE OR REPLACE VIEW v_cost_center_budget_summary AS
SELECT 
    cc.code AS cost_center_code,
    cc.name AS cost_center_name,
    dept.name AS department_name,
    p_owner.name AS cost_center_owner,
    COUNT(DISTINCT p.id) AS active_projects_count,
    SUM(COALESCE(pb.capex_planned, 0.00)) AS total_capex_planned,
    SUM(COALESCE(pb.opex_planned, 0.00)) AS total_opex_planned,
    SUM(COALESCE(pb.actual_ytd, 0.00)) AS total_actual_spend_ytd,
    SUM(COALESCE(pb.variance, 0.00)) AS total_variance
FROM cost_center cc
LEFT JOIN department dept ON dept.id = cc.department_id
LEFT JOIN person p_owner ON p_owner.id = cc.owner_person_id
LEFT JOIN project p ON p.cost_center_code = cc.code
LEFT JOIN project_budget pb ON pb.project_id = p.id AND pb.fiscal_year = 2026
GROUP BY cc.code, cc.name, dept.name, p_owner.name;

-- 6. View: Active Priority Incidents with SLA
CREATE OR REPLACE VIEW v_active_incidents AS
SELECT 
    inc.id AS incident_id,
    inc.priority,
    inc.short_description,
    p.id AS project_id,
    p.name AS project_name,
    ci.name AS ci_name,
    t.name AS assignment_team,
    assignee.name AS assigned_person,
    inc.opened_at,
    NOW() - inc.opened_at AS age_duration,
    CASE 
        WHEN inc.priority = 'P1' AND (NOW() - inc.opened_at) > INTERVAL '4 hours' THEN TRUE
        WHEN inc.priority = 'P2' AND (NOW() - inc.opened_at) > INTERVAL '8 hours' THEN TRUE
        ELSE FALSE 
    END AS is_sla_breached
FROM sn_incident inc
JOIN project p ON p.id = inc.project_id
LEFT JOIN sn_ci ci ON ci.id = inc.ci_id
LEFT JOIN team t ON t.id = inc.assignment_team_id
LEFT JOIN person assignee ON assignee.id = inc.assigned_to_person_id
WHERE inc.state IN ('New', 'Open', 'In Progress', 'Pending Vendor');
