# AutoNova Company Brain — Data Dictionary

This document defines the tables, typed columns, constraints, and source mappings across the 5 architectural layers of the Company Brain database (`hackathon_team_20`).

---

## Layer A: Organisation & Project Master

### `department`
- `id` (VARCHAR(50), PK): Department code (`DEPT-CYB`, `DEPT-DIV-IT`, etc.).
- `name` (VARCHAR(255), NOT NULL): Department title.
- `level` (VARCHAR(50), NOT NULL): Hierarchy level (`Group`, `Division`, `Department`, `Team`).
- `parent_id` (VARCHAR(50), FK $\rightarrow$ `department.id`): Parent organizational unit.
- `head_person_id` (VARCHAR(50), FK $\rightarrow$ `person.id`): Designated leader.

### `domain`
- `id` (VARCHAR(50), PK): Business domain code (`CYB`, `DTFS`, `FIN`, `PRO`, `SAL`, `HR`).
- `name` (VARCHAR(255), NOT NULL): Full domain name.
- `description` (TEXT): High-level operational charter.

### `cost_center`
- `code` (VARCHAR(50), PK): Financial cost center identifier (`CC-FIN-01`, etc.).
- `name` (VARCHAR(255), NOT NULL): Cost center descriptive name.
- `department_id` (VARCHAR(50), FK $\rightarrow$ `department.id`): Owning department.
- `budget_allocated` (NUMERIC(15,2)): Annual allocated financial budget in EUR.

### `person`
- `id` (VARCHAR(50), PK): Employee ID (`E1001`, `E1024`, etc.).
- `name` (VARCHAR(255), NOT NULL): Full employee name.
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Corporate email address.
- `job_title` (VARCHAR(255)): Professional job title.
- `role_type` (VARCHAR(50)): Classification (`Management`, `PM`, `Developer`, `Architect`, `Support`).
- `team_id` (VARCHAR(50), FK $\rightarrow$ `team.id`): Primary team assignment.
- `location` (VARCHAR(100)): Primary work location (Stuttgart, Pune, Portland, etc.).

### `project`
- `id` (VARCHAR(50), PK): Project ID (`P-CYB-01`, `P-FIN-01`, etc.).
- `name` (VARCHAR(255), NOT NULL): Project name.
- `domain_id` (VARCHAR(50), FK $\rightarrow$ `domain.id`): Owning business domain.
- `status` (VARCHAR(50), NOT NULL): Lifecycle status (`Planned`, `Active`, `Live`, `Maintenance`, `Completed`).
- `phase` (VARCHAR(50)): Delivery phase (`Initiation`, `Planning`, `Execution`, `Testing`, `Operations`).
- `business_criticality` (VARCHAR(20)): Business criticality tier (`critical`, `high`, `medium`, `low`).
- `business_owner_id` (VARCHAR(50), FK $\rightarrow$ `person.id`): Accountable business executive.
- `tech_lead_id` (VARCHAR(50), FK $\rightarrow$ `person.id`): Accountable technical architect/lead.

### `project_budget`
- `id` (SERIAL, PK): Record ID.
- `project_id` (VARCHAR(50), FK $\rightarrow$ `project.id`): Target project.
- `fiscal_year` (INT, NOT NULL): Financial year (2026).
- `capex_planned` (NUMERIC(15,2)): Capital expenditure budget (EUR).
- `opex_planned` (NUMERIC(15,2)): Operational expenditure budget (EUR).
- `actual_ytd` (NUMERIC(15,2)): Year-to-date spent (EUR).
- `variance` (NUMERIC(15,2)): Budget variance delta (EUR).

---

## Layer B: Source-Specific Typed Tables

### LeanIX
- `lx_application`: Application fact sheet with TIME classification, SLA, RTO/RPO, annual run cost, compliance flags.
- `lx_lifecycle`: Milestone dates (plan, phase_in, active, phase_out, eol).
- `lx_it_component`: Technology components with vendor, version, release date, and EOL timestamp.
- `lx_interface`: Point-to-point application interfaces with protocols and payload definitions.
- `lx_data_object`: Data entities with sensitivity classification and PII indicators.

### Confluence
- `cf_space`: Confluence space metadata per project.
- `cf_page`: Full Markdown technical documentation with hierarchy and tags.
- `adr`: Architecture Decision Records with context, decision, chosen technology, and rationale.

### SharePoint
- `sp_site` & `sp_document`: Deep long-form business documents (Charters, Technical Specifications, Troubleshooting Runbooks, Disaster Recovery Guides).

### GitHub
- `gh_repo`, `gh_commit`, `gh_pull_request`, `gh_release`, `gh_file`, `gh_dependency`: Code repositories, commit logs, PR reviews, release tags, configuration files, and software dependency inventories.

### Jira Cloud
- `jira_project`, `jira_sprint`, `jira_issue`, `jira_issue_link`: Epics, stories, bugs, sprint velocity, and blocking dependencies.

### Microsoft Teams
- `tm_channel`, `tm_meeting`, `tm_decision`, `tm_action_item`: Meeting transcripts, recorded decisions, and assigned actions.

### ServiceNow
- `sn_ci`, `sn_incident`, `sn_change`, `sn_kb_article`, `sn_operational_readiness`: CMDB assets, P1-P4 incidents, CAB change tickets, troubleshooting KB articles, and operational readiness scorecards.

---

## Layer C: Semantic Graph
- `entity`: Natural key registry (`type`, `natural_key`, `name`, `project_id`, `attributes`).
- `relationship`: Directed typed graph edges (`src_id`, `rel_type`, `dst_id`, `weight`, `attributes`).

---

## Layer D: Knowledge, Evidence & Vectors
- `source_item`: Raw immutable JSON payloads with SHA-256 `content_hash` for incremental delta sync.
- `document`: Unified text artifact repository with RBAC security tags.
- `document_chunk`: Chunked text segments with generated `tsv` (`tsvector`) and cosine vector embeddings (`vector(1536)`).
- `source_authority`: Evidence weighting matrix across sources and document types.
