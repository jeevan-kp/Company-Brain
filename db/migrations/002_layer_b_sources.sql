-- ============================================================================
-- Migration 002: Layer B — Source-Specific Typed Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LEANIX (Enterprise Architecture)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lx_application (
    id VARCHAR(50) PRIMARY KEY, -- e.g. LX-APP-P-FIN-01
    project_id VARCHAR(50) REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(100),
    description TEXT,
    application_type VARCHAR(50) DEFAULT 'Business Application',
    hosting_type VARCHAR(50) DEFAULT 'Cloud Private' CHECK (hosting_type IN ('Cloud Public', 'Cloud Private', 'Hybrid', 'On-Premises', 'SaaS')),
    business_criticality VARCHAR(20) DEFAULT 'High' CHECK (business_criticality IN ('Mission Critical', 'Business Critical', 'Business Operational', 'Administrative')),
    functional_fit VARCHAR(20) DEFAULT 'Appropriate' CHECK (functional_fit IN ('Perfect', 'Appropriate', 'Insufficient', 'Unreasonable')),
    technical_fit VARCHAR(20) DEFAULT 'Appropriate' CHECK (technical_fit IN ('Perfect', 'Appropriate', 'Insufficient', 'Unreasonable')),
    time_classification VARCHAR(20) DEFAULT 'Invest' CHECK (time_classification IN ('Tolerate', 'Invest', 'Migrate', 'Eliminate')),
    sla_percentage NUMERIC(5, 2) DEFAULT 99.90,
    rto_hours INT DEFAULT 4,
    rpo_hours INT DEFAULT 1,
    user_count INT DEFAULT 500,
    annual_run_cost NUMERIC(15, 2) DEFAULT 0.00,
    data_quality_pct NUMERIC(5, 2) DEFAULT 95.00,
    compliance_gdpr BOOLEAN DEFAULT TRUE,
    compliance_sox BOOLEAN DEFAULT FALSE,
    compliance_iso27001 BOOLEAN DEFAULT TRUE,
    compliance_tisax BOOLEAN DEFAULT TRUE,
    successor_id VARCHAR(50) REFERENCES lx_application(id) ON DELETE SET NULL,
    predecessor_id VARCHAR(50) REFERENCES lx_application(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lx_lifecycle (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    plan_date DATE,
    phase_in_date DATE,
    active_date DATE,
    phase_out_date DATE,
    end_of_life_date DATE,
    current_phase VARCHAR(50) DEFAULT 'active' CHECK (current_phase IN ('plan', 'phase_in', 'active', 'phase_out', 'end_of_life')),
    CONSTRAINT uq_lx_lifecycle UNIQUE (app_id)
);

CREATE TABLE IF NOT EXISTS lx_business_capability (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CAP-L1-FIN
    name VARCHAR(255) NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('L1', 'L2', 'L3')),
    parent_id VARCHAR(50) REFERENCES lx_business_capability(id) ON DELETE SET NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS lx_app_capability (
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    capability_id VARCHAR(50) NOT NULL REFERENCES lx_business_capability(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (app_id, capability_id)
);

CREATE TABLE IF NOT EXISTS lx_user_group (
    id VARCHAR(50) PRIMARY KEY,
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    user_count INT DEFAULT 50,
    location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS lx_data_object (
    id VARCHAR(50) PRIMARY KEY, -- e.g. DO-FIN-INVOICE
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sensitivity VARCHAR(50) DEFAULT 'Internal' CHECK (sensitivity IN ('Public', 'Internal', 'Confidential', 'Restricted', 'Strictly Confidential')),
    contains_pii BOOLEAN DEFAULT FALSE,
    retention_period_months INT DEFAULT 84,
    last_security_review DATE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS lx_interface (
    id VARCHAR(100) PRIMARY KEY, -- e.g. IF-FIN01-PRO01-INVOICES
    provider_app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    consumer_app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    protocol VARCHAR(50) DEFAULT 'REST' CHECK (protocol IN ('REST', 'SOAP', 'Kafka', 'SFTP', 'EventGrid', 'gRPC', 'Database Link')),
    direction VARCHAR(20) DEFAULT 'Outbound',
    frequency VARCHAR(50) DEFAULT 'Real-time' CHECK (frequency IN ('Real-time', 'Hourly', 'Daily Batch', 'Weekly', 'On-demand')),
    data_objects TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS lx_it_component (
    id VARCHAR(50) PRIMARY KEY, -- e.g. ITC-K8S-128
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('runtime', 'database', 'middleware', 'cloud_service', 'os', 'framework', 'library')),
    vendor VARCHAR(100),
    version VARCHAR(50),
    release_date DATE,
    eol_date DATE,
    cost_per_year NUMERIC(15, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS lx_app_itcomponent (
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    component_id VARCHAR(50) NOT NULL REFERENCES lx_it_component(id) ON DELETE CASCADE,
    environment VARCHAR(50) DEFAULT 'Production' CHECK (environment IN ('Production', 'Staging', 'Development', 'DR')),
    PRIMARY KEY (app_id, component_id, environment)
);

CREATE TABLE IF NOT EXISTS lx_tag (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    tag_group VARCHAR(100) NOT NULL,
    tag_value VARCHAR(100) NOT NULL,
    CONSTRAINT uq_lx_tag UNIQUE (app_id, tag_group, tag_value)
);

CREATE TABLE IF NOT EXISTS lx_subscription (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(50) NOT NULL REFERENCES lx_application(id) ON DELETE CASCADE,
    person_id VARCHAR(50) NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('Application Owner', 'Technical Lead', 'Enterprise Architect', 'Security Officer', 'Business SME')),
    CONSTRAINT uq_lx_subscription UNIQUE (app_id, person_id, role_type)
);

-- ----------------------------------------------------------------------------
-- 2. CONFLUENCE (Technical Documentation & Knowledge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cf_space (
    id VARCHAR(50) PRIMARY KEY, -- Space Key e.g. SPACE_FIN01
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cf_page (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CF-PAGE-FIN01-001
    space_id VARCHAR(50) NOT NULL REFERENCES cf_space(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    parent_page_id VARCHAR(50) REFERENCES cf_page(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('architecture-overview', 'solution-design', 'runbook', 'adr', 'poc', 'process', 'budget', 'meeting-notes', 'general')),
    body_md TEXT NOT NULL,
    labels TEXT[],
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adr (
    id VARCHAR(50) PRIMARY KEY, -- e.g. ADR-FIN01-001
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    page_id VARCHAR(50) REFERENCES cf_page(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Proposed', 'Accepted', 'Rejected', 'Deprecated', 'Superseded')),
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    consequences TEXT,
    chosen_technology VARCHAR(255),
    decided_by VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    decided_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS poc (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    page_id VARCHAR(50) REFERENCES cf_page(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    tech_stack TEXT,
    results TEXT NOT NULL,
    recommendation VARCHAR(50) CHECK (recommendation IN ('Adopt', 'Reject', 'Iterate', 'Hold')),
    conducted_by VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    completed_at DATE
);

CREATE TABLE IF NOT EXISTS project_process (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    page_id VARCHAR(50) REFERENCES cf_page(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100),
    steps TEXT,
    responsible_team_id VARCHAR(50) REFERENCES team(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 3. SHAREPOINT (Business, Governance & Operations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sp_site (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sp_library (
    id VARCHAR(50) PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL REFERENCES sp_site(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS sp_document (
    id VARCHAR(50) PRIMARY KEY, -- e.g. SP-DOC-FIN01-CHARTER
    site_id VARCHAR(50) NOT NULL REFERENCES sp_site(id) ON DELETE CASCADE,
    library_id VARCHAR(50) REFERENCES sp_library(id) ON DELETE SET NULL,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('Charter', 'Specification', 'UserGuide', 'Runbook', 'RiskRegister', 'AuditReport', 'SOP', 'SteeringDeck')),
    file_type VARCHAR(20) DEFAULT 'docx',
    file_size_kb INT DEFAULT 120,
    version VARCHAR(20) DEFAULT '1.0',
    content_text TEXT NOT NULL,
    charter_sponsor_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    charter_budget_capex NUMERIC(15, 2),
    charter_budget_opex NUMERIC(15, 2),
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. GITHUB (Source Code, Commits, CI/CD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gh_repo (
    id VARCHAR(100) PRIMARY KEY, -- e.g. autonova-group/s4hana-finance-core
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    primary_language VARCHAR(50),
    default_branch VARCHAR(50) DEFAULT 'main',
    is_private BOOLEAN DEFAULT TRUE,
    stars_count INT DEFAULT 12,
    forks_count INT DEFAULT 3,
    open_issues_count INT DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gh_commit (
    hash VARCHAR(40) PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    message TEXT NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL,
    lines_added INT DEFAULT 0,
    lines_deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gh_pull_request (
    id VARCHAR(100) PRIMARY KEY, -- e.g. PR-FIN01-042
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    pr_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    state VARCHAR(20) DEFAULT 'closed' CHECK (state IN ('open', 'closed', 'merged')),
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    reviewer_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    merged_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gh_release (
    id VARCHAR(100) PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    body TEXT,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gh_file (
    id VARCHAR(150) PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- e.g. Dockerfile, Helm, Terraform, Manifest
    content TEXT NOT NULL,
    size_bytes INT,
    last_commit_hash VARCHAR(40)
);

CREATE TABLE IF NOT EXISTS gh_dependency (
    id SERIAL PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    package_manager VARCHAR(50) DEFAULT 'npm' CHECK (package_manager IN ('npm', 'maven', 'pip', 'gomod', 'cargo', 'nuget')),
    license VARCHAR(100),
    is_vulnerable BOOLEAN DEFAULT FALSE,
    cve_id VARCHAR(50),
    CONSTRAINT uq_gh_dependency UNIQUE (repo_id, name, version)
);

CREATE TABLE IF NOT EXISTS gh_workflow (
    id VARCHAR(100) PRIMARY KEY,
    repo_id VARCHAR(100) NOT NULL REFERENCES gh_repo(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'success',
    last_run_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. JIRA CLOUD (Agile & Issue Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jira_project (
    key VARCHAR(20) PRIMARY KEY, -- e.g. FIN1
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    lead_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jira_sprint (
    id VARCHAR(50) PRIMARY KEY, -- e.g. SPRINT-FIN1-01
    jira_project_key VARCHAR(20) NOT NULL REFERENCES jira_project(key) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(20) DEFAULT 'closed' CHECK (state IN ('active', 'closed', 'future')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    goal TEXT,
    velocity_points INT DEFAULT 35
);

CREATE TABLE IF NOT EXISTS jira_issue (
    key VARCHAR(50) PRIMARY KEY, -- e.g. FIN1-101
    jira_project_key VARCHAR(20) NOT NULL REFERENCES jira_project(key) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    sprint_id VARCHAR(50) REFERENCES jira_sprint(id) ON DELETE SET NULL,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('Epic', 'Story', 'Task', 'Bug', 'Subtask')),
    summary VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Backlog', 'To Do', 'In Progress', 'In Review', 'Testing', 'Done', 'Blocked')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Highest', 'High', 'Medium', 'Low', 'Lowest')),
    story_points NUMERIC(4, 1),
    reporter_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    assignee_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    epic_key VARCHAR(50) REFERENCES jira_issue(key) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS jira_issue_link (
    id SERIAL PRIMARY KEY,
    source_issue_key VARCHAR(50) NOT NULL REFERENCES jira_issue(key) ON DELETE CASCADE,
    target_issue_key VARCHAR(50) NOT NULL REFERENCES jira_issue(key) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL CHECK (link_type IN ('Blocks', 'Depends On', 'Relates To', 'Duplicates', 'Clones')),
    CONSTRAINT uq_jira_issue_link UNIQUE (source_issue_key, target_issue_key, link_type)
);

-- ----------------------------------------------------------------------------
-- 6. TEAMS / MEETINGS (Collaboration & Decisions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tm_channel (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tm_meeting (
    id VARCHAR(50) PRIMARY KEY, -- e.g. MTG-FIN01-01
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    channel_id VARCHAR(50) REFERENCES tm_channel(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'Architecture Review' CHECK (meeting_type IN ('Architecture Review', 'Steering Committee', 'Daily Standup', 'Post-Mortem', 'Sprint Planning', 'Risk Sync')),
    organizer_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 45,
    summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tm_decision (
    id VARCHAR(50) PRIMARY KEY,
    meeting_id VARCHAR(50) NOT NULL REFERENCES tm_meeting(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    decision_text TEXT NOT NULL,
    rationale TEXT,
    impact_level VARCHAR(20) DEFAULT 'Medium' CHECK (impact_level IN ('High', 'Medium', 'Low')),
    decided_by_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    decided_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS tm_action_item (
    id VARCHAR(50) PRIMARY KEY,
    meeting_id VARCHAR(50) NOT NULL REFERENCES tm_meeting(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assignee_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Cancelled'))
);

CREATE TABLE IF NOT EXISTS tm_message (
    id VARCHAR(50) PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL REFERENCES tm_channel(id) ON DELETE CASCADE,
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. SERVICENOW (ITSM, Operations & CMDB)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sn_ci (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CI-APP-FIN-01
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ci_class VARCHAR(50) NOT NULL CHECK (ci_class IN ('Business Application', 'Application Service', 'Kubernetes Cluster', 'Database Instance', 'Server', 'API Gateway')),
    environment VARCHAR(50) DEFAULT 'Production' CHECK (environment IN ('Production', 'Staging', 'Development', 'DR')),
    status VARCHAR(50) DEFAULT 'Operational' CHECK (status IN ('Operational', 'Maintenance', 'Degraded', 'Retired')),
    owner_team_id VARCHAR(50) REFERENCES team(id) ON DELETE SET NULL,
    support_tier VARCHAR(20) DEFAULT 'Tier-1'
);

CREATE TABLE IF NOT EXISTS sn_ci_relationship (
    id SERIAL PRIMARY KEY,
    parent_ci_id VARCHAR(50) NOT NULL REFERENCES sn_ci(id) ON DELETE CASCADE,
    child_ci_id VARCHAR(50) NOT NULL REFERENCES sn_ci(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL CHECK (relation_type IN ('Runs On', 'Depends On', 'Connects To', 'Hosted By')),
    CONSTRAINT uq_sn_ci_relationship UNIQUE (parent_ci_id, child_ci_id, relation_type)
);

CREATE TABLE IF NOT EXISTS sn_incident (
    id VARCHAR(50) PRIMARY KEY, -- e.g. INC-001298
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    ci_id VARCHAR(50) REFERENCES sn_ci(id) ON DELETE SET NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    impact VARCHAR(10) DEFAULT '1 - High',
    urgency VARCHAR(10) DEFAULT '1 - High',
    state VARCHAR(50) NOT NULL CHECK (state IN ('New', 'Open', 'In Progress', 'Pending Vendor', 'Resolved', 'Closed')),
    short_description VARCHAR(500) NOT NULL,
    root_cause TEXT,
    resolution_notes TEXT,
    opened_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    assignment_team_id VARCHAR(50) REFERENCES team(id) ON DELETE SET NULL,
    assigned_to_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sn_change (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CHG-005421
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    ci_id VARCHAR(50) REFERENCES sn_ci(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Standard', 'Normal', 'Emergency')),
    risk VARCHAR(20) DEFAULT 'Low' CHECK (risk IN ('Very High', 'High', 'Moderate', 'Low')),
    state VARCHAR(50) DEFAULT 'Closed' CHECK (state IN ('Draft', 'Submitted', 'CAB Approval', 'Scheduled', 'Implementing', 'Review', 'Closed', 'Cancelled')),
    cab_approved BOOLEAN DEFAULT TRUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    implementation_plan TEXT,
    backout_plan TEXT,
    start_window TIMESTAMPTZ,
    end_window TIMESTAMPTZ,
    requested_by_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sn_problem (
    id VARCHAR(50) PRIMARY KEY, -- e.g. PRB-000842
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    ci_id VARCHAR(50) REFERENCES sn_ci(id) ON DELETE SET NULL,
    state VARCHAR(50) DEFAULT 'Known Error' CHECK (state IN ('Open', 'Investigation', 'Known Error', 'Resolved', 'Closed')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    workaround TEXT,
    permanent_fix TEXT
);

CREATE TABLE IF NOT EXISTS sn_kb_article (
    id VARCHAR(50) PRIMARY KEY, -- e.g. KB-00892
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    ci_id VARCHAR(50) REFERENCES sn_ci(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Troubleshooting',
    article_body TEXT NOT NULL,
    author_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    views_count INT DEFAULT 120,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sn_sla (
    id VARCHAR(50) PRIMARY KEY,
    ci_id VARCHAR(50) NOT NULL REFERENCES sn_ci(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_percentage NUMERIC(5, 2) DEFAULT 99.90,
    actual_percentage NUMERIC(5, 2) DEFAULT 99.95,
    status VARCHAR(50) DEFAULT 'Met' CHECK (status IN ('Met', 'Breached', 'In Progress'))
);

CREATE TABLE IF NOT EXISTS sn_operational_readiness (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    monitoring_enabled BOOLEAN DEFAULT TRUE,
    alerting_configured BOOLEAN DEFAULT TRUE,
    backup_configured BOOLEAN DEFAULT TRUE,
    last_dr_test_date DATE,
    on_call_rota_active BOOLEAN DEFAULT TRUE,
    runbook_exists BOOLEAN DEFAULT TRUE,
    runbook_url VARCHAR(500),
    health_score NUMERIC(5, 2) DEFAULT 95.0,
    evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sn_operational_readiness UNIQUE (project_id)
);

-- Layer B Indexes
CREATE INDEX IF NOT EXISTS idx_cf_page_project ON cf_page(project_id);
CREATE INDEX IF NOT EXISTS idx_cf_page_type ON cf_page(page_type);
CREATE INDEX IF NOT EXISTS idx_sp_doc_project ON sp_document(project_id);
CREATE INDEX IF NOT EXISTS idx_sp_doc_type ON sp_document(doc_type);
CREATE INDEX IF NOT EXISTS idx_gh_commit_repo ON gh_commit(repo_id);
CREATE INDEX IF NOT EXISTS idx_jira_issue_project ON jira_issue(project_id);
CREATE INDEX IF NOT EXISTS idx_jira_issue_status ON jira_issue(status);
CREATE INDEX IF NOT EXISTS idx_sn_incident_project ON sn_incident(project_id);
CREATE INDEX IF NOT EXISTS idx_sn_incident_priority ON sn_incident(priority);
CREATE INDEX IF NOT EXISTS idx_sn_incident_state ON sn_incident(state);
