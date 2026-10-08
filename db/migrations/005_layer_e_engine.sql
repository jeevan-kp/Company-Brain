-- ============================================================================
-- Migration 005: Layer E — Engine Support and Governance
-- ============================================================================

CREATE TABLE IF NOT EXISTS readiness_rule (
    id VARCHAR(50) PRIMARY KEY, -- e.g. RR-ARCH-01
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Architecture', 'Operations', 'Security', 'Governance', 'Finance')),
    rule_logic_description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'High' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    weight FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readiness_result (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    rule_id VARCHAR(50) NOT NULL REFERENCES readiness_rule(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARN', 'NOT_APPLICABLE')),
    score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    details JSONB DEFAULT '{}'::jsonb,
    evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_readiness_result UNIQUE (project_id, rule_id)
);

CREATE TABLE IF NOT EXISTS conflict_rule (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CR-STATUS-01
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_a VARCHAR(50) NOT NULL,
    source_b VARCHAR(50) NOT NULL,
    query_pattern TEXT,
    severity VARCHAR(20) DEFAULT 'High' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conflict (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(50) NOT NULL REFERENCES conflict_rule(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    source_a_entity VARCHAR(255),
    source_b_entity VARCHAR(255),
    source_a_value TEXT,
    source_b_value TEXT,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED')),
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_state (
    source_system VARCHAR(50) PRIMARY KEY,
    last_sync_timestamp TIMESTAMPTZ,
    high_watermark_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'IDLE',
    records_synced INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'SUCCESS' CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL')),
    records_processed INT DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS seed_anomalies (
    id VARCHAR(50) PRIMARY KEY, -- e.g. ANOM-01
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    sources_involved TEXT[] NOT NULL,
    description TEXT NOT NULL,
    expected_detection TEXT NOT NULL,
    test_query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Baseline Readiness Rules (10 named rules)
INSERT INTO readiness_rule (id, name, category, rule_logic_description, severity, weight)
VALUES
    ('RR-ARCH-01', 'Architecture Sign-off Present', 'Architecture', 'Project must possess at least one accepted Architecture Overview and one ADR on Confluence prior to Testing/Live phase.', 'Critical', 1.5),
    ('RR-OPS-01', 'Disaster Recovery Freshness', 'Operations', 'Live projects must have executed a documented DR drill within the preceding 365 days in ServiceNow.', 'Critical', 2.0),
    ('RR-OPS-02', 'Production Runbook Available', 'Operations', 'Every Live or Deploying project must have a valid operational troubleshooting runbook in SharePoint.', 'High', 1.5),
    ('RR-OPS-03', 'Monitoring & Alerting Configured', 'Operations', 'ServiceNow Operational Readiness must verify active monitoring and on-call alerting.', 'High', 1.0),
    ('RR-SEC-01', 'No High/Critical CVEs', 'Security', 'GitHub dependencies must contain 0 unpatched Critical CVEs on the production default branch.', 'Critical', 2.0),
    ('RR-SEC-02', 'PII Data Security Review', 'Security', 'Any LeanIX Data Object flagged with contains_pii must have a security review timestamp within 12 months.', 'High', 1.2),
    ('RR-GOV-01', 'Owner & Lead Assigned', 'Governance', 'Project must have distinct, active Business Owner and Tech Lead assigned in Project Master.', 'Medium', 1.0),
    ('RR-GOV-02', 'Lifecycle State Consistency', 'Governance', 'LeanIX lifecycle phase must match Project Master and Jira delivery status.', 'High', 1.0),
    ('RR-FIN-01', 'Approved Budget Baseline', 'Finance', 'Project must have an approved budget record for the current fiscal year with variance < 15%.', 'Medium', 0.8),
    ('RR-OPS-04', 'Zero Breached P1 Incidents', 'Operations', 'Live production services must have zero unresolved P1 incidents older than SLA thresholds.', 'Critical', 2.0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    rule_logic_description = EXCLUDED.rule_logic_description,
    severity = EXCLUDED.severity;

-- Seed Conflict Rules (3 baseline rules)
INSERT INTO conflict_rule (id, name, description, source_a, source_b, query_pattern, severity)
VALUES
    ('CR-STATUS-01', 'Project Status vs Jira Delivery Mismatch', 'Flags when LeanIX or Project Master marks a project as Live/Active while active Jira sprints contain open core delivery epics.', 'leanix', 'jira', 'lx_application.lifecycle = active vs jira_issue.epic in progress', 'High'),
    ('CR-BUDGET-01', 'Project Charter vs Cost Center Budget Divergence', 'Flags when SharePoint Charter Capex budget deviates from approved project_budget capex_planned by > 5%.', 'sharepoint', 'project_budget', 'sp_document.charter_budget_capex != project_budget.capex_planned', 'Medium'),
    ('CR-TECH-01', 'Confluence ADR Decision vs GitHub Dependency Drift', 'Flags when Confluence ADR mandates an architecture technology (e.g. Rust/Go) but GitHub repo dependencies contradict.', 'confluence', 'github', 'adr.chosen_technology != gh_dependency.package_manager', 'High')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Seed 15 Planted Anomalies Catalogue
INSERT INTO seed_anomalies (id, project_id, type, sources_involved, description, expected_detection, test_query)
VALUES
    ('ANOM-01', 'P-DTFS-01', 'Status Mismatch', ARRAY['leanix', 'jira'], 'LeanIX lifecycle marked Active (Live), but Jira active sprint has open epic for core MVP delivery.', 'Detected via conflict query between lx_lifecycle and jira_issue status.', 'SELECT p.id, l.current_phase, COUNT(j.key) FROM project p JOIN lx_application a ON a.project_id = p.id JOIN lx_lifecycle l ON l.app_id = a.id JOIN jira_issue j ON j.project_id = p.id WHERE l.current_phase = ''active'' AND j.issue_type = ''Epic'' AND j.status != ''Done'' GROUP BY p.id, l.current_phase;'),
    ('ANOM-02', 'P-FIN-01', 'Budget Divergence', ARRAY['sharepoint', 'project_budget'], 'SharePoint Project Charter states Capex €4.2M; project_budget table records Capex €3.5M.', 'Detected via numeric delta between sp_document.charter_budget_capex and project_budget.capex_planned.', 'SELECT d.project_id, d.charter_budget_capex, pb.capex_planned FROM sp_document d JOIN project_budget pb ON pb.project_id = d.project_id WHERE d.doc_type = ''Charter'' AND d.charter_budget_capex != pb.capex_planned;'),
    ('ANOM-03', 'P-CYB-01', 'Tech Stack Drift', ARRAY['confluence', 'github'], 'Confluence ADR-003 approved Rust for ingestion agent; GitHub gh_dependency shows Python / Go implementation.', 'Detected by comparing ADR chosen_technology text against repo dependencies.', 'SELECT a.project_id, a.chosen_technology, r.primary_language FROM adr a JOIN gh_repo r ON r.project_id = a.project_id WHERE a.chosen_technology ILIKE ''%Rust%'' AND r.primary_language NOT ILIKE ''%Rust%'';'),
    ('ANOM-04', 'P-PRO-01', 'Owner Discrepancy', ARRAY['leanix', 'sharepoint'], 'LeanIX Application Owner is PER-014 (Ravi Menon); SharePoint Charter lists PER-008 (Marcus Vance).', 'Detected by comparing subscription role on LeanIX app vs charter sponsor on SharePoint.', 'SELECT a.project_id, s.person_id AS lx_owner, d.charter_sponsor_person_id AS sp_sponsor FROM lx_application a JOIN lx_subscription s ON s.app_id = a.id AND s.role_type = ''Application Owner'' JOIN sp_document d ON d.project_id = a.project_id AND d.doc_type = ''Charter'' WHERE s.person_id != d.charter_sponsor_person_id;'),
    ('ANOM-05', 'P-SAL-01', 'Phantom Team in Runbook', ARRAY['sharepoint', 'team_member'], 'P1 Escalation Runbook directs incident calls to TEAM-OBSOLETE-01 which has 0 members in team_member.', 'Detected by querying teams referenced in runbook text that lack members.', 'SELECT t.id, t.name, COUNT(tm.id) AS member_count FROM team t LEFT JOIN team_member tm ON tm.team_id = t.id WHERE t.id = ''T-SAL-LEGACY'' GROUP BY t.id, t.name HAVING COUNT(tm.id) = 0;'),
    ('ANOM-06', 'P-CYB-02', 'Live Project without DR', ARRAY['servicenow', 'project'], 'Project status is Live, but sn_operational_readiness.last_dr_test_date is > 18 months ago (> 540 days).', 'Detected by evaluating last_dr_test_date against CURRENT_DATE - INTERVAL ''540 days''.', 'SELECT p.id, p.name, o.last_dr_test_date FROM project p JOIN sn_operational_readiness o ON o.project_id = p.id WHERE p.status = ''Live'' AND o.last_dr_test_date < CURRENT_DATE - INTERVAL ''540 days'';'),
    ('ANOM-07', 'P-PRO-01', 'EOL IT Component', ARRAY['leanix', 'lx_it_component'], 'LeanIX lists Kubernetes v1.22 (EOL: 2022-10-28) in active production runtime.', 'Detected by querying IT components in production where eol_date < CURRENT_DATE.', 'SELECT a.project_id, c.name, c.version, c.eol_date FROM lx_app_itcomponent ac JOIN lx_application a ON a.id = ac.app_id JOIN lx_it_component c ON c.id = ac.component_id WHERE ac.environment = ''Production'' AND c.eol_date < CURRENT_DATE;'),
    ('ANOM-08', 'P-DTFS-02', 'Unreviewed PII Object', ARRAY['leanix', 'lx_data_object'], 'Data Object Customer Credit Score has contains_pii = true and last_security_review = NULL.', 'Detected by checking data objects with contains_pii = TRUE and NULL review date.', 'SELECT a.project_id, d.name, d.contains_pii, d.last_security_review FROM lx_data_object d JOIN lx_application a ON a.id = d.app_id WHERE d.contains_pii = TRUE AND d.last_security_review IS NULL;'),
    ('ANOM-09', 'P-FIN-02', 'Missing Architecture Baseline', ARRAY['confluence', 'project'], 'Project status is Testing / Go-Live imminent, but 0 Confluence pages have page_type = architecture-overview.', 'Detected by checking Testing/Live projects with 0 architecture-overview pages.', 'SELECT p.id, p.name, p.phase FROM project p WHERE p.phase IN (''Testing'', ''Deploying'') AND NOT EXISTS (SELECT 1 FROM cf_page cp WHERE cp.project_id = p.id AND cp.page_type = ''architecture-overview'');'),
    ('ANOM-10', 'P-SAL-02', 'Stale Governance Docs', ARRAY['sharepoint', 'github'], 'GitHub has 45 commits in last 30 days, but all SharePoint specifications have updated_at > 14 months old.', 'Detected by comparing latest commit timestamp against max document update timestamp.', 'SELECT p.id, MAX(c.committed_at) AS last_commit, MAX(d.updated_at) AS last_doc_update FROM project p JOIN gh_repo r ON r.project_id = p.id JOIN gh_commit c ON c.repo_id = r.id JOIN sp_document d ON d.project_id = p.id GROUP BY p.id HAVING MAX(c.committed_at) > CURRENT_TIMESTAMP - INTERVAL ''30 days'' AND MAX(d.updated_at) < CURRENT_TIMESTAMP - INTERVAL ''14 months'';'),
    ('ANOM-11', 'P-CYB-01', 'Unregistered Interface', ARRAY['leanix', 'project_dependency'], 'LeanIX defines real-time Kafka interface to P-SAL-01, but no dependency exists in project_dependencies.csv.', 'Detected by finding LeanIX interfaces between projects missing in project_dependency table.', 'SELECT i.id, i.provider_app_id, i.consumer_app_id FROM lx_interface i JOIN lx_application pa ON pa.id = i.provider_app_id JOIN lx_application ca ON ca.id = i.consumer_app_id WHERE NOT EXISTS (SELECT 1 FROM project_dependency pd WHERE pd.consumer_id = ca.project_id AND pd.provider_id = pa.project_id);'),
    ('ANOM-12', 'P-DTFS-01', 'Open P1 on Live App', ARRAY['servicenow'], 'Project P-DTFS-01 has 2 active P1 incidents with SLA breached > 48 hours.', 'Detected by filtering open P1 incidents where opened_at < NOW() - INTERVAL ''48 hours''.', 'SELECT i.id, i.project_id, i.priority, i.state, i.opened_at FROM sn_incident i WHERE i.priority = ''P1'' AND i.state IN (''New'', ''Open'', ''In Progress'') AND i.opened_at < CURRENT_TIMESTAMP - INTERVAL ''48 hours'';'),
    ('ANOM-13', 'P-FIN-01', 'Unapproved Emergency Change', ARRAY['servicenow'], 'Emergency Change CHG-9021 applied to SAP S/4HANA core production database without CAB approval record.', 'Detected by filtering Emergency changes with cab_approved = FALSE and state = Closed.', 'SELECT c.id, c.project_id, c.type, c.cab_approved, c.state FROM sn_change c WHERE c.type = ''Emergency'' AND c.cab_approved = FALSE AND c.state = ''Closed'';'),
    ('ANOM-14', 'P-PRO-01', 'Allocation Over-subscription', ARRAY['project_person', 'person'], 'Staff member PER-022 allocated 70% to P-PRO-01 and 50% to P-PRO-02 in project_person (Total 120%).', 'Detected by summing allocation_pct by person across active projects > 100%.', 'SELECT person_id, SUM(allocation_pct) AS total_allocation FROM project_person GROUP BY person_id HAVING SUM(allocation_pct) > 100.0;'),
    ('ANOM-15', 'P-CYB-02', 'Vulnerable Production Library', ARRAY['github'], 'GitHub repo declares log4j-core:2.14.1 (Critical CVE) on production main branch.', 'Detected by querying gh_dependency for is_vulnerable = TRUE.', 'SELECT d.repo_id, d.name, d.version, d.cve_id FROM gh_dependency d WHERE d.is_vulnerable = TRUE;')
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    test_query = EXCLUDED.test_query;
