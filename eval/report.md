# Company Brain — Benchmark Evaluation Report

**Date:** 2026-10-07T17:36:48.458Z  
**Total Questions Evaluated:** 230  
**Overall Accuracy / Pass Rate:** **99.1%** (228/230)  
**Citation Validity:** **100.0%**  
**Permission Leaks:** **0** (Target: 0)  

## ⏱️ Latency Performance

| Metric | Target | Measured (p50) | Measured (p95) |
| :--- | :--- | :--- | :--- |
| **Retrieval Latency** | < 150 ms | **4 ms** | **5 ms** |
| **End-to-End Latency** | < 6,000 ms | **13 ms** | **16 ms** |

## 📂 Performance by Category

| Category | Total Questions | Passed | Pass Rate | Avg Latency |
| :--- | :--- | :--- | :--- | :--- |
| `lookup` | 41 | 41 | **100.0%** | 15 ms |
| `who_to_contact` | 10 | 10 | **100.0%** | 13 ms |
| `impact_analysis` | 42 | 42 | **100.0%** | 14 ms |
| `dependency_chain` | 10 | 10 | **100.0%** | 14 ms |
| `cross_domain_people` | 14 | 14 | **100.0%** | 14 ms |
| `workload` | 11 | 10 | **90.9%** | 13 ms |
| `platform_analytics` | 4 | 4 | **100.0%** | 12 ms |
| `approval_and_governance` | 10 | 10 | **100.0%** | 15 ms |
| `scenario` | 3 | 2 | **66.7%** | 13 ms |
| `runbook` | 2 | 2 | **100.0%** | 12 ms |
| `budget` | 2 | 2 | **100.0%** | 14 ms |
| `code_and_repo` | 1 | 1 | **100.0%** | 17 ms |
| `security_vulnerability` | 1 | 1 | **100.0%** | 13 ms |
| `anomaly_conflict` | 4 | 4 | **100.0%** | 14 ms |
| `permissions_rbac` | 1 | 1 | **100.0%** | 13 ms |
| `operational_readiness` | 1 | 1 | **100.0%** | 14 ms |
| `incident_sla` | 1 | 1 | **100.0%** | 13 ms |
| `collaboration_decisions` | 18 | 18 | **100.0%** | 14 ms |
| `architecture_adr` | 18 | 18 | **100.0%** | 12 ms |
| `initiative_alignment` | 18 | 18 | **100.0%** | 12 ms |
| `cmdb_ci` | 18 | 18 | **100.0%** | 13 ms |

## ⚠️ Discrepancy & Failure Log

- **[Q117]** "Which people are allocated to 3 or more projects and how many?"  
  *Reason:* Fact mismatch: Missing key entities [claudia lang, daniel hoffmann, stefan kraus, sarah mitchell, nils fischer, rahul verma, robert kline, markus bauer, sneha kulkarni, michael carter, ravi menon, anita deshmukh, meera iyer, jonas keller, vikram rao, katharina roth, arjun patel, divya reddy, oliver grant, lena fischer, thomas albrecht, sandra koehler, andreas schneider, stephanie krueger, james whitfield, alexander beck, matthias ernst, sophie lenz, frank dietz, laura bennett] in retrieved context
- **[Q144]** "HR changes the leaver-event format in SuccessFactors. What is the blast radius?"  
  *Reason:* Fact mismatch: Missing key entities [p-hr-01, p-cyb-02, p-cyb-06, p-fin-01, p-pro-01, p-sal-01, p-fin-02, p-fin-03, p-fin-04, p-fin-05, p-fin-06, p-pro-02, p-pro-03, p-dtfs-01, p-dtfs-03, p-sal-06, p-dtfs-06, p-sal-03, p-sal-02, p-dtfs-05, p-pro-04, p-dtfs-04, p-sal-05] in retrieved context
