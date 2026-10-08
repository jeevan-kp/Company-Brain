# AutoNova Company Brain — Planted Anomalies & Conflict Test Catalogue

This catalog documents the **15 intentional data discrepancies and governance anomalies** planted across the synthetic dataset. These cases test the semantic engine's ability to cross-reference data across disparate enterprise tools, identify operational risks, and detect contradictions.

---

## Complete Anomaly Matrix

| ID | Project ID | Anomaly Title | Source Systems Involved | Contradiction Description | Expected SQL Detection Query |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ANOM-01` | `P-DTFS-01` | Status Mismatch | LeanIX vs Jira | LeanIX lifecycle marked `Active` (Live), but Jira active sprint has open epic for core MVP delivery. | `SELECT ... WHERE lx.phase = 'active' AND jira.open_epic_count > 0` |
| `ANOM-02` | `P-FIN-01` | Budget Divergence | SharePoint vs DB | SharePoint Project Charter states Capex €4.2M; `project_budget` table records Capex €3.5M. | `SELECT ... WHERE sp.budget_capex != pb.capex_planned` |
| `ANOM-03` | `P-CYB-01` | Tech Stack Drift | Confluence vs GitHub | Confluence ADR-003 approved Rust for ingestion agent; GitHub `gh_dependency` shows Python / Go implementation. | `SELECT ... WHERE adr.decision LIKE '%Rust%' AND gh.primary_lang != 'Rust'` |
| `ANOM-04` | `P-PRO-01` | Owner Discrepancy | LeanIX vs SharePoint | LeanIX Application Owner is `PER-014` (Ravi Menon); SharePoint Charter lists `PER-008` (Marcus Vance). | `SELECT ... WHERE lx.app_owner != sp.charter_sponsor` |
| `ANOM-05` | `P-SAL-01` | Phantom Team in Runbook | SharePoint vs Master | P1 Escalation Runbook directs incident calls to `TEAM-OBSOLETE-01` which has 0 members in `team_member`. | `SELECT ... WHERE runbook.team_id NOT IN (SELECT team_id FROM team_member)` |
| `ANOM-06` | `P-CYB-02` | Live Project without DR | ServiceNow Ops | Project status is `Live`, but `sn_operational_readiness.last_dr_test_date` is > 18 months ago (> 540 days). | `SELECT ... WHERE p.status = 'Live' AND dr_date < NOW() - INTERVAL '540 days'` |
| `ANOM-07` | `P-PRO-01` | EOL IT Component | LeanIX vs Master | LeanIX lists Kubernetes `v1.22` (EOL: 2022-10-28) in active production runtime. | `SELECT ... WHERE itc.eol_date < CURRENT_DATE AND app.status = 'Live'` |
| `ANOM-08` | `P-DTFS-02` | Unreviewed PII Object | LeanIX Data Objects | Data Object `Customer Credit Score` has `contains_pii = true` and `last_security_review = NULL`. | `SELECT ... WHERE do.contains_pii = TRUE AND do.last_review IS NULL` |
| `ANOM-09` | `P-FIN-02` | Missing Architecture Baseline | Confluence vs Master | Project status is `Testing` / Go-Live imminent, but 0 Confluence pages have `page_type = 'architecture-overview'`. | `SELECT ... WHERE p.phase = 'Testing' AND p.id NOT IN (SELECT project_id FROM cf_page WHERE page_type='architecture')` |
| `ANOM-10` | `P-SAL-02` | Stale Governance Docs | SharePoint vs GitHub | GitHub has 45 commits in last 30 days, but all SharePoint specifications have `updated_at` > 14 months old. | `SELECT ... WHERE gh.active_days < 30 AND sp.max_updated < NOW() - INTERVAL '14 months'` |
| `ANOM-11` | `P-CYB-01` | Unregistered Interface | LeanIX vs `project_dependency` | LeanIX defines real-time Kafka interface to `P-SAL-01`, but no dependency exists in `project_dependencies.csv`. | `SELECT ... WHERE iface.target NOT IN (SELECT provider_id FROM project_dependency)` |
| `ANOM-12` | `P-DTFS-01` | Open P1 on Live App | ServiceNow vs Master | Project `P-DTFS-01` has 2 active P1 incidents with SLA breached > 48 hours. | `SELECT ... WHERE inc.priority = 'P1' AND inc.state = 'Open' AND inc.opened_at < NOW() - INTERVAL '48 hours'` |
| `ANOM-13` | `P-FIN-01` | Unapproved Emergency Change | ServiceNow vs CAB | Emergency Change `CHG-9021` applied to SAP S/4HANA core production database without CAB approval record. | `SELECT ... WHERE chg.type = 'Emergency' AND chg.cab_approved = FALSE AND chg.state = 'Closed'` |
| `ANOM-14` | `P-PRO-01` | Allocation Over-subscription | Allocations vs Person | Staff member `PER-022` allocated 70% to `P-PRO-01` and 50% to `P-PRO-02` in project_person (Total 120%). | `SELECT person_id, SUM(allocation_pct) FROM project_person GROUP BY person_id HAVING SUM(allocation_pct) > 100` |
| `ANOM-15` | `P-CYB-02` | Vulnerable Production Library | GitHub Dependencies | GitHub repo declares `log4j-core:2.14.1` (Critical CVE) on production main branch. | `SELECT ... WHERE dep.name = 'log4j-core' AND dep.is_vulnerable = TRUE` |
