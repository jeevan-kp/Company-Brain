# Company Brain — Team 20 (Database & Synthetic Data Layer)

Permission-aware Knowledge Graph and Semantic Data Layer for AutoNova Group (automotive enterprise scenario) built on **PostgreSQL 17 + pgvector**.

---

## 🏛️ Architecture Overview

The system models **31 projects**, **86 personnel**, **32 teams**, **30 platform services**, and **7 enterprise systems**:
- **Layer A (Master)**: Domains, Departments, Cost Centers, People, Projects, Budgets, Platforms, Services, Vendors.
- **Layer B (Typed Sources)**: LeanIX (EA), Confluence (Docs/ADRs), SharePoint (Runbooks/Charters), GitHub (Code/Deps), Jira (Sprints/Issues), Teams (Meetings/Decisions), ServiceNow (CMDB/Incidents).
- **Layer C (Semantic Graph)**: Unified graph nodes (`entity`) and edges (`relationship`) rebuilt via stored procedure `rebuild_graph()`.
- **Layer D (Knowledge & Vectors)**: Incremental raw sync (`source_item` with SHA-256 hash), normalized `document`, and searchable `document_chunk` with hybrid `tsvector` full-text and `vector(1536)` HNSW cosine indexing.
- **Layer E (Engine Support)**: 10 Operational Readiness Rules, 3 Conflict Rules, and 15 Seeded Planted Anomalies.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Docker / PostgreSQL 17**: Docker with `pgvector/pgvector:pg17` or a local PostgreSQL 17 instance.

### 2. Configure Environment
```bash
cp .env.example .env
```
Default connection parameters connect to local database `hackathon_team_20` with user `postgres`.

### 3. Start Database (Docker)
```bash
docker compose up -d
```

### 4. Rebuild & Seed Everything (One Command)
```bash
npm install
npm run db:reset && npm run seed
```

### 5. Run Verification Suite
```bash
npm run verify
```

---

## 📂 Project Structure

```
├── db/
│   ├── migrations/             # Idempotent SQL migrations (001 to 006)
│   │   ├── 001_layer_a_master.sql
│   │   ├── 002_layer_b_sources.sql
│   │   ├── 003_layer_c_graph.sql
│   │   ├── 004_layer_d_knowledge_vectors.sql
│   │   ├── 005_layer_e_engine.sql
│   │   └── 006_views_and_functions.sql
│   └── verify.sql              # SQL verification test suite
├── seed/
│   └── company_brain/          # Canonical base CSVs (12 files)
├── mock/                       # Generated synthetic JSON payloads
│   ├── leanix/
│   ├── confluence/
│   ├── sharepoint/
│   ├── github/
│   ├── jira/
│   ├── teams/
│   └── servicenow/
├── scripts/
│   ├── generators/             # Deterministic mock data generators
│   │   ├── gen_all_mocks.js
│   │   ├── gen_leanix.js
│   │   ├── gen_confluence.js
│   │   ├── gen_sharepoint.js
│   │   ├── gen_github.js
│   │   ├── gen_jira.js
│   │   ├── gen_teams.js
│   │   └── gen_servicenow.js
│   ├── loaders/                # PostgreSQL data ingestion loaders
│   │   ├── db_pool.js          # Enforces max 3 DB connections & TLS
│   │   ├── load_base_csv.js
│   │   ├── load_leanix.js
│   │   ├── load_confluence.js
│   │   ├── load_sharepoint.js
│   │   ├── load_github.js
│   │   ├── load_jira.js
│   │   ├── load_teams.js
│   │   ├── load_servicenow.js
│   │   ├── chunk_and_vectorize.js
│   │   └── load_all.js
│   ├── db_reset.js             # Migration runner
│   └── verify.js               # Assertion test runner
├── docs/
│   ├── ERD.md                  # Complete Mermaid ERD and relationship flows
│   ├── data_dictionary.md      # Full table & column specifications
│   └── planted_anomalies.md    # 15 planted anomalies catalogue & queries
├── golden_qa_v2.csv            # 230 Benchmark Golden Q&A Pairs
├── docker-compose.yaml         # PostgreSQL 17 + pgvector container
└── package.json
```

---

## 🧪 Verification & Benchmark Tests

Run `npm run verify` to test:
- **Referential Integrity**: 0 orphan foreign key records across all 7 sources.
- **SQL Derivability**: Direct retrieval of documents, service outage chains, RACI matrices, cost center budgets, and active incidents.
- **Planted Anomaly Detection**: Verified SQL queries for all 15 intentional contradictions.
- **Full-Text & Vector Readiness**: GIN index queries on `document_chunk.tsv`.

---

## 🔒 Security & Azure Production Constraints
- **Connection Pool Limit**: Hard limit of **max 3 connections** configured in `scripts/loaders/db_pool.js`.
- **RBAC Security Filtering**: Enforced via stored function `visible_documents(p_role, p_person_id)`.
- **Zero Hardcoded Secrets**: All credentials dynamically injected via `.env` / Azure Key Vault.
