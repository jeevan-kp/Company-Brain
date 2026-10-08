-- ============================================================================
-- Migration 001: Layer A — Organisation and Project Master
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Department Hierarchy
CREATE TABLE IF NOT EXISTS department (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('Group', 'Division', 'Department', 'Team')),
    parent_id VARCHAR(50) REFERENCES department(id) ON DELETE SET NULL,
    head_person_id VARCHAR(50), -- Deferred FK to person
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Domain (from domains.csv)
CREATE TABLE IF NOT EXISTS domain (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_person_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cost Center
CREATE TABLE IF NOT EXISTS cost_center (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id VARCHAR(50) REFERENCES department(id) ON DELETE SET NULL,
    owner_person_id VARCHAR(50),
    budget_allocated NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Role Catalogue
CREATE TABLE IF NOT EXISTS role (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Management', 'PM', 'Developer', 'Support', 'Architect', 'Other')),
    description TEXT
);

-- Person (from people.csv)
CREATE TABLE IF NOT EXISTS person (
    id VARCHAR(50) PRIMARY KEY, -- e.g. PER-001
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    job_title VARCHAR(255),
    role_id VARCHAR(50) REFERENCES role(id) ON DELETE SET NULL,
    role_type VARCHAR(50) DEFAULT 'Developer' CHECK (role_type IN ('Management', 'PM', 'Developer', 'Support', 'Architect')),
    team_id VARCHAR(50), -- FK to team
    department_id VARCHAR(50) REFERENCES department(id) ON DELETE SET NULL,
    cost_center_code VARCHAR(50) REFERENCES cost_center(code) ON DELETE SET NULL,
    manager_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add deferred FKs
ALTER TABLE department 
    DROP CONSTRAINT IF EXISTS fk_dept_head,
    ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_person_id) REFERENCES person(id) ON DELETE SET NULL;

ALTER TABLE cost_center
    DROP CONSTRAINT IF EXISTS fk_cc_owner,
    ADD CONSTRAINT fk_cc_owner FOREIGN KEY (owner_person_id) REFERENCES person(id) ON DELETE SET NULL;

ALTER TABLE domain
    DROP CONSTRAINT IF EXISTS fk_domain_lead,
    ADD CONSTRAINT fk_domain_lead FOREIGN KEY (lead_person_id) REFERENCES person(id) ON DELETE SET NULL;

-- Team (from teams.csv)
CREATE TABLE IF NOT EXISTS team (
    id VARCHAR(50) PRIMARY KEY, -- e.g. T-CYB-TECH-01
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('platform', 'domain', 'shared', 'management')),
    domain_id VARCHAR(50) REFERENCES domain(id) ON DELETE SET NULL,
    department_id VARCHAR(50) REFERENCES department(id) ON DELETE SET NULL,
    lead_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE person
    DROP CONSTRAINT IF EXISTS fk_person_team,
    ADD CONSTRAINT fk_person_team FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE SET NULL;

-- Team Member
CREATE TABLE IF NOT EXISTS team_member (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    person_id VARCHAR(50) NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    role_in_team VARCHAR(100),
    is_primary BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_member UNIQUE (team_id, person_id)
);

-- Strategic Initiatives & Programmes
CREATE TABLE IF NOT EXISTS initiative (
    id VARCHAR(50) PRIMARY KEY, -- e.g. INIT-01
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(100) NOT NULL, -- e.g. 'Cloud First 2026', 'Zero Trust', 'SAP RISE Migration'
    sponsor_person_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'In Progress',
    start_date DATE,
    end_date DATE,
    budget NUMERIC(15, 2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project Master (from projects.csv)
CREATE TABLE IF NOT EXISTS project (
    id VARCHAR(50) PRIMARY KEY, -- e.g. P-FIN-01
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    parent_project_id VARCHAR(50) REFERENCES project(id) ON DELETE SET NULL,
    project_type VARCHAR(50) DEFAULT 'Standard' CHECK (project_type IN ('Programme', 'Project', 'Workstream', 'Service')),
    domain_id VARCHAR(50) REFERENCES domain(id) ON DELETE SET NULL,
    department_id VARCHAR(50) REFERENCES department(id) ON DELETE SET NULL,
    cost_center_code VARCHAR(50) REFERENCES cost_center(code) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Planned', 'Active', 'Live', 'Maintenance', 'Completed', 'Decommissioned')),
    phase VARCHAR(50) DEFAULT 'Execution' CHECK (phase IN ('Initiation', 'Planning', 'Execution', 'Testing', 'Deploying', 'Operations', 'Closing')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    business_criticality VARCHAR(20) DEFAULT 'Medium' CHECK (business_criticality IN ('Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Critical', 'High', 'Medium', 'Low')),
    rag_status VARCHAR(10) DEFAULT 'Green' CHECK (rag_status IN ('Green', 'Amber', 'Red')),
    planned_start DATE,
    planned_end DATE,
    go_live_date DATE,
    sponsor_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    business_owner_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    tech_lead_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    pm_id VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    summary TEXT,
    objectives TEXT,
    business_case TEXT,
    strategic_alignment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project to Initiative Link
CREATE TABLE IF NOT EXISTS project_initiative (
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    initiative_id VARCHAR(50) NOT NULL REFERENCES initiative(id) ON DELETE CASCADE,
    strategic_weight NUMERIC(5, 2) DEFAULT 1.0,
    PRIMARY KEY (project_id, initiative_id)
);

-- Project Budget
CREATE TABLE IF NOT EXISTS project_budget (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL,
    capex_planned NUMERIC(15, 2) DEFAULT 0.00,
    opex_planned NUMERIC(15, 2) DEFAULT 0.00,
    actual_ytd NUMERIC(15, 2) DEFAULT 0.00,
    forecast NUMERIC(15, 2) DEFAULT 0.00,
    variance NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EUR',
    cost_center_code VARCHAR(50) REFERENCES cost_center(code) ON DELETE SET NULL,
    approved_by VARCHAR(50) REFERENCES person(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_budget UNIQUE (project_id, fiscal_year)
);

-- Project Cost Breakdown
CREATE TABLE IF NOT EXISTS project_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('licenses', 'cloud_consumption', 'vendor_contractor', 'internal_labour', 'support')),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EUR',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project Person / RACI Allocation (from allocations.csv + RACI)
CREATE TABLE IF NOT EXISTS project_person (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    person_id VARCHAR(50) NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    raci_role VARCHAR(20) DEFAULT 'R' CHECK (raci_role IN ('R', 'A', 'C', 'I', 'Responsible', 'Accountable', 'Consulted', 'Informed')),
    allocation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    CONSTRAINT uq_project_person UNIQUE (project_id, person_id, role)
);

-- Project Dependencies (from project_dependencies.csv)
CREATE TABLE IF NOT EXISTS project_dependency (
    id SERIAL PRIMARY KEY,
    consumer_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('data', 'process', 'identity', 'infrastructure', 'security')),
    criticality VARCHAR(20) NOT NULL CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    description TEXT,
    interface_id VARCHAR(100),
    CONSTRAINT uq_project_dependency UNIQUE (consumer_id, provider_id, type)
);

-- Platforms (from platforms.csv)
CREATE TABLE IF NOT EXISTS platform (
    id VARCHAR(50) PRIMARY KEY, -- e.g. PLAT-AZURE
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(100),
    lead_team_id VARCHAR(50) REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Platform Services (from platform_services.csv)
CREATE TABLE IF NOT EXISTS platform_service (
    id VARCHAR(50) PRIMARY KEY, -- e.g. SVC-AZURE-AKS
    name VARCHAR(255) NOT NULL,
    platform_id VARCHAR(50) NOT NULL REFERENCES platform(id) ON DELETE CASCADE,
    owner_team_id VARCHAR(50) REFERENCES team(id) ON DELETE SET NULL,
    service_type VARCHAR(100),
    tier VARCHAR(20) DEFAULT 'Standard',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Service Dependencies (from service_dependencies.csv)
CREATE TABLE IF NOT EXISTS service_dependency (
    id SERIAL PRIMARY KEY,
    consumer_service_id VARCHAR(50) NOT NULL REFERENCES platform_service(id) ON DELETE CASCADE,
    provider_service_id VARCHAR(50) NOT NULL REFERENCES platform_service(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'infrastructure',
    criticality VARCHAR(20) DEFAULT 'High' CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    CONSTRAINT uq_service_dependency UNIQUE (consumer_service_id, provider_service_id)
);

-- Project Service Usage (from project_service_usage.csv)
CREATE TABLE IF NOT EXISTS project_service_usage (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL REFERENCES platform_service(id) ON DELETE CASCADE,
    purpose TEXT,
    criticality VARCHAR(20) DEFAULT 'High' CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    consumption_tier VARCHAR(50) DEFAULT 'Production',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_service_usage UNIQUE (project_id, service_id)
);

-- Vendor & Contracts
CREATE TABLE IF NOT EXISTS vendor (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    contact_email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_vendor (
    project_id VARCHAR(50) NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    contract_ref VARCHAR(100),
    annual_spend NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    PRIMARY KEY (project_id, vendor_id)
);

-- Indexes for Layer A
CREATE INDEX IF NOT EXISTS idx_person_team ON person(team_id);
CREATE INDEX IF NOT EXISTS idx_person_dept ON person(department_id);
CREATE INDEX IF NOT EXISTS idx_person_email ON person(email);
CREATE INDEX IF NOT EXISTS idx_project_domain ON project(domain_id);
CREATE INDEX IF NOT EXISTS idx_project_status ON project(status);
CREATE INDEX IF NOT EXISTS idx_project_criticality ON project(business_criticality);
CREATE INDEX IF NOT EXISTS idx_project_person_person ON project_person(person_id);
CREATE INDEX IF NOT EXISTS idx_project_person_project ON project_person(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_dep_consumer ON project_dependency(consumer_id);
CREATE INDEX IF NOT EXISTS idx_proj_dep_provider ON project_dependency(provider_id);
CREATE INDEX IF NOT EXISTS idx_proj_svc_project ON project_service_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_svc_service ON project_service_usage(service_id);
