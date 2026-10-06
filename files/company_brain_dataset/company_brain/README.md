# AutoNova Group - Company Brain Golden Dataset

Fictional commercial-vehicle manufacturer modelled on a Daimler-like group. Focus domains: Cyber Security, DTFS, Finance, Procurement, Sales (+ HR as shared upstream function).

## Files
| File | Rows | Purpose |
|---|---|---|
| domains.csv | 6 | Business domains |
| platforms.csv | 5 | Central tech platforms (Azure, AWS, SAP, Snowflake, Databricks) |
| platform_services.csv | 30 | Services on each platform + owner team |
| service_dependencies.csv | 22 | Service-to-service dependencies (e.g. AKS -> Networking) |
| teams.csv | 32 | Business, technical and platform teams |
| people.csv | 86 | Employees (fictional) |
| projects.csv | 31 | Projects with owners, teams, status |
| project_service_usage.csv | 73 | Which project uses which service, and why |
| project_dependencies.csv | 53 | Project -> project dependencies with type + criticality |
| allocations.csv | 209 | Person -> project allocation % and role |
| graph_edges.csv | 658 | All relations as one edge list (for Neo4j / NetworkX) |
| golden_qa.csv | 145 | Golden questions, answers and reasoning paths |

## Conventions
- `project_id_consumer` DEPENDS ON `depends_on_project_id_provider`. If the provider changes, the consumer is impacted.
- Impact propagates through critical/high dependencies; medium/low only degrade features.
- Allocation per person is <= 100%; the remainder is run/BAU.
- All names, emails and numbers are synthetic.

## Golden Q&A categories
- approval_and_governance: 10
- cross_domain_people: 14
- dependency_chain: 10
- impact_analysis: 42
- lookup: 41
- platform_analytics: 4
- scenario: 3
- who_to_contact: 10
- workload: 11

Golden answers were computed from the graph files by script (build.py logic), so they are consistent with the CSVs.
