-- ============================================================================
-- db/verify.sql — Automated Verification Test Suite for Company Brain
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REFERENTIAL INTEGRITY & ORPHAN CHECKS
-- ----------------------------------------------------------------------------
-- Check for orphan project references in Layer B
SELECT 'Orphan LeanIX Apps' AS check_name, COUNT(*) AS violations
FROM lx_application WHERE project_id NOT IN (SELECT id FROM project);

SELECT 'Orphan Confluence Spaces' AS check_name, COUNT(*) AS violations
FROM cf_space WHERE project_id NOT IN (SELECT id FROM project);

SELECT 'Orphan SharePoint Sites' AS check_name, COUNT(*) AS violations
FROM sp_site WHERE project_id NOT IN (SELECT id FROM project);

SELECT 'Orphan GitHub Repos' AS check_name, COUNT(*) AS violations
FROM gh_repo WHERE project_id NOT IN (SELECT id FROM project);

SELECT 'Orphan Jira Projects' AS check_name, COUNT(*) AS violations
FROM jira_project WHERE project_id NOT IN (SELECT id FROM project);

SELECT 'Orphan ServiceNow CIs' AS check_name, COUNT(*) AS violations
FROM sn_ci WHERE project_id NOT IN (SELECT id FROM project);

-- ----------------------------------------------------------------------------
-- 2. CORE BUSINESS QUERY DERIVATIONS
-- ----------------------------------------------------------------------------
-- Q1: All documents for P-FIN-01
SELECT 'P-FIN-01 Documents' AS query_test, COUNT(*) AS doc_count
FROM document WHERE project_id = 'P-FIN-01';

-- Q2: Impact of SAP RISE Outage (AZ-SAP-RISE)
SELECT 'SAP RISE Outage Impact' AS query_test, impacted_project_id, impacted_project_name, usage_criticality
FROM v_service_impact WHERE service_id LIKE '%SAP%' LIMIT 5;

-- Q3: RACI matrix for P-PRO-01
SELECT 'P-PRO-01 RACI' AS query_test, p.name AS person_name, pp.role, pp.raci_role, pp.allocation_pct
FROM project_person pp
JOIN person p ON p.id = pp.person_id
WHERE pp.project_id = 'P-PRO-01';

-- Q4: Budget Variance by Cost Center
SELECT 'Budget Summary' AS query_test, cost_center_code, total_capex_planned, total_actual_spend_ytd, total_variance
FROM v_cost_center_budget_summary;

-- Q5: Projects in Initiative INIT-02 (Zero Trust)
SELECT 'Zero Trust Initiative' AS query_test, p.id, p.name, p.status
FROM project p
JOIN project_initiative pi ON pi.project_id = p.id
WHERE pi.initiative_id = 'INIT-02';

-- Q6: Open P1 Incidents on Live Projects
SELECT 'Open P1 Incidents' AS query_test, incident_id, priority, project_name, is_sla_breached
FROM v_active_incidents WHERE priority = 'P1';

-- Q7: IT Components past End-of-Life
SELECT 'EOL Components' AS query_test, a.project_id, c.name, c.version, c.eol_date
FROM lx_app_itcomponent ac
JOIN lx_application a ON a.id = ac.app_id
JOIN lx_it_component c ON c.id = ac.component_id
WHERE c.eol_date < CURRENT_DATE;

-- ----------------------------------------------------------------------------
-- 3. PLANTED ANOMALY DETECTION TEST (15 CASES)
-- ----------------------------------------------------------------------------
-- ANOM-01: Status Mismatch on P-DTFS-01
SELECT 'ANOM-01 Status Mismatch' AS anomaly, p.id, l.current_phase AS lx_phase, COUNT(j.key) AS open_epics
FROM project p
JOIN lx_application a ON a.project_id = p.id
JOIN lx_lifecycle l ON l.app_id = a.id
JOIN jira_issue j ON j.project_id = p.id
WHERE p.id = 'P-DTFS-01' AND l.current_phase = 'active' AND j.issue_type = 'Epic' AND j.status != 'Done'
GROUP BY p.id, l.current_phase;

-- ANOM-02: Budget Divergence on P-FIN-01
SELECT 'ANOM-02 Budget Divergence' AS anomaly, d.project_id, d.charter_budget_capex AS sp_charter, pb.capex_planned AS db_budget
FROM sp_document d
JOIN project_budget pb ON pb.project_id = d.project_id
WHERE d.project_id = 'P-FIN-01' AND d.doc_type = 'Charter' AND d.charter_budget_capex != pb.capex_planned;

-- ANOM-03: Tech Stack Drift on P-CYB-01
SELECT 'ANOM-03 Tech Stack Drift' AS anomaly, a.project_id, a.chosen_technology AS adr_tech, r.primary_language AS repo_lang
FROM adr a
JOIN gh_repo r ON r.project_id = a.project_id
WHERE a.project_id = 'P-CYB-01' AND a.chosen_technology ILIKE '%Rust%' AND r.primary_language NOT ILIKE '%Rust%';

-- ANOM-04: Owner Discrepancy on P-PRO-01
SELECT 'ANOM-04 Owner Discrepancy' AS anomaly, a.project_id, s.person_id AS lx_owner, d.charter_sponsor_person_id AS sp_sponsor
FROM lx_application a
JOIN lx_subscription s ON s.app_id = a.id AND s.role_type = 'Application Owner'
JOIN sp_document d ON d.project_id = a.project_id AND d.doc_type = 'Charter'
WHERE a.project_id = 'P-PRO-01' AND s.person_id != d.charter_sponsor_person_id;

-- ANOM-06: Live Project without DR on P-CYB-02
SELECT 'ANOM-06 DR Stale' AS anomaly, p.id, p.name, o.last_dr_test_date
FROM project p
JOIN sn_operational_readiness o ON o.project_id = p.id
WHERE p.id = 'P-CYB-02' AND o.last_dr_test_date < CURRENT_DATE - INTERVAL '540 days';

-- ANOM-07: EOL IT Component on P-PRO-01
SELECT 'ANOM-07 EOL Component' AS anomaly, a.project_id, c.name, c.version, c.eol_date
FROM lx_app_itcomponent ac
JOIN lx_application a ON a.id = ac.app_id
JOIN lx_it_component c ON c.id = ac.component_id
WHERE a.project_id = 'P-PRO-01' AND c.eol_date < CURRENT_DATE;

-- ANOM-08: Unreviewed PII on P-DTFS-02
SELECT 'ANOM-08 Unreviewed PII' AS anomaly, a.project_id, d.name, d.contains_pii, d.last_security_review
FROM lx_data_object d
JOIN lx_application a ON a.id = d.app_id
WHERE a.project_id = 'P-DTFS-02' AND d.contains_pii = TRUE AND d.last_security_review IS NULL;

-- ANOM-09: Missing Architecture Page on P-FIN-02
SELECT 'ANOM-09 Missing Architecture' AS anomaly, p.id, p.name
FROM project p
WHERE p.id = 'P-FIN-02' AND NOT EXISTS (SELECT 1 FROM cf_page cp WHERE cp.project_id = p.id AND cp.page_type = 'architecture-overview');

-- ANOM-12: Open P1 on Live App P-DTFS-01
SELECT 'ANOM-12 Open P1 Breaches' AS anomaly, i.id, i.project_id, i.priority, i.state, i.opened_at
FROM sn_incident i
WHERE i.project_id = 'P-DTFS-01' AND i.priority = 'P1' AND i.state IN ('New', 'Open', 'In Progress');

-- ANOM-13: Unapproved Emergency Change on P-FIN-01
SELECT 'ANOM-13 Unapproved Change' AS anomaly, c.id, c.project_id, c.type, c.cab_approved, c.state
FROM sn_change c
WHERE c.project_id = 'P-FIN-01' AND c.type = 'Emergency' AND c.cab_approved = FALSE AND c.state = 'Closed';

-- ANOM-15: Vulnerable Library on P-CYB-02
SELECT 'ANOM-15 Vulnerable Dep' AS anomaly, d.repo_id, d.name, d.version, d.cve_id
FROM gh_dependency d
WHERE d.repo_id LIKE '%p-cyb-02%' AND d.is_vulnerable = TRUE;

-- ----------------------------------------------------------------------------
-- 4. AGENT RETRIEVAL FUNCTIONS (Migration 007)
-- ----------------------------------------------------------------------------
-- a) resolve_entities
SELECT 'resolve_entities' AS test_fn, entity_name, entity_type, match_score, matched_alias 
FROM resolve_entities('Security Log Monitoring SIEM') LIMIT 3;

-- b) project_context
SELECT 'project_context' AS test_fn, project_context('P-FIN-01', 'Developer', NULL) AS profile_json;

-- c) impact_of
SELECT 'impact_of' AS test_fn, impacted_project_id, impacted_project_name, impact_level, dependency_chain 
FROM impact_of((SELECT id FROM entity WHERE natural_key = 'service:AZ-SEN' LIMIT 1));

-- d) hybrid_search
SELECT 'hybrid_search' AS test_fn, project_id, title, doc_type, rank_score 
FROM hybrid_search('PostgreSQL database connection pooling', NULL, NULL, 'Developer', NULL, 3);

-- ----------------------------------------------------------------------------
-- 5. FULL TEXT SEARCH VERIFICATION
-- ----------------------------------------------------------------------------
SELECT 'Full-Text Search' AS test, dc.project_id, doc.title, ts_rank(dc.tsv, to_tsquery('english', 'PostgreSQL | Kubernetes | incident')) AS rank
FROM document_chunk dc
JOIN document doc ON doc.id = dc.document_id
WHERE dc.tsv @@ to_tsquery('english', 'PostgreSQL | Kubernetes | incident')
ORDER BY rank DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 6. TABLE ROW COUNT SUMMARY
-- ----------------------------------------------------------------------------
SELECT 'SUMMARY' AS metric, 'department' AS table_name, COUNT(*) AS count FROM department
UNION ALL SELECT 'SUMMARY', 'domain', COUNT(*) FROM domain
UNION ALL SELECT 'SUMMARY', 'cost_center', COUNT(*) FROM cost_center
UNION ALL SELECT 'SUMMARY', 'person', COUNT(*) FROM person
UNION ALL SELECT 'SUMMARY', 'team', COUNT(*) FROM team
UNION ALL SELECT 'SUMMARY', 'project', COUNT(*) FROM project
UNION ALL SELECT 'SUMMARY', 'project_person', COUNT(*) FROM project_person
UNION ALL SELECT 'SUMMARY', 'project_dependency', COUNT(*) FROM project_dependency
UNION ALL SELECT 'SUMMARY', 'platform_service', COUNT(*) FROM platform_service
UNION ALL SELECT 'SUMMARY', 'lx_application', COUNT(*) FROM lx_application
UNION ALL SELECT 'SUMMARY', 'cf_page', COUNT(*) FROM cf_page
UNION ALL SELECT 'SUMMARY', 'adr', COUNT(*) FROM adr
UNION ALL SELECT 'SUMMARY', 'sp_document', COUNT(*) FROM sp_document
UNION ALL SELECT 'SUMMARY', 'gh_repo', COUNT(*) FROM gh_repo
UNION ALL SELECT 'SUMMARY', 'gh_commit', COUNT(*) FROM gh_commit
UNION ALL SELECT 'SUMMARY', 'jira_issue', COUNT(*) FROM jira_issue
UNION ALL SELECT 'SUMMARY', 'tm_meeting', COUNT(*) FROM tm_meeting
UNION ALL SELECT 'SUMMARY', 'sn_incident', COUNT(*) FROM sn_incident
UNION ALL SELECT 'SUMMARY', 'entity', COUNT(*) FROM entity
UNION ALL SELECT 'SUMMARY', 'relationship', COUNT(*) FROM relationship
UNION ALL SELECT 'SUMMARY', 'source_item', COUNT(*) FROM source_item
UNION ALL SELECT 'SUMMARY', 'document', COUNT(*) FROM document
UNION ALL SELECT 'SUMMARY', 'document_chunk', COUNT(*) FROM document_chunk;
