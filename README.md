# Company Brain — Connected Knowledge. Trusted Answers. Real Enterprise Insight.

> **AutoNova Group (Daimler Truck Commercial Vehicle Group)**  
> A living, permission-aware semantic knowledge graph connecting **31 strategic projects**, **86 cross-domain employees**, **30 cloud platform services**, and **145 Golden Q&A benchmarks** across 6 business domains and 5 central cloud platforms.

---

## 🌟 Executive Overview

In large enterprises like Daimler Truck, critical architecture decisions, delivery statuses, system dependencies, incident reports, and staff allocations are fragmented across disparate silos (LeanIX, Jira, Confluence, SharePoint, Teams, and ServiceNow). 

**Company Brain** solves this by:
1. **Building an interconnected semantic knowledge graph (658 edges)** across all systems, decisions, dependencies, and personnel.
2. **Simulating cascading outage impact & blast radius analysis** (e.g., *Which projects and teams are impacted if SAP RISE, AKS, or Microsoft Entra ID has an outage?*).
3. **Detecting cross-source contradictions & governance violations** (e.g., *Architecture Decision ADR-001 vs GitHub deployment configs vs Jira open blockers*).
4. **Providing grounded AI query orchestration (Google Gemini 3.8)** with verifiable citations and role-based persona permissions.
5. **Offering 145 verified Golden Q&A benchmark questions** across 9 reasoning categories for automated accuracy verification.

---

## 🏗️ Architecture & Domain Matrix

```
                                    COMPANY BRAIN ARCHITECTURE
                                    
  [ Enterprise Adapters & APIs ] ───► [ Ingestion & Normalization Layer ] ───► [ PostgreSQL 17 + pgvector ]
  • SAP LeanIX (OpenAPI / GraphQL)   • Canonical NormalizedRecord              • Recursive CTEs
  • Atlassian Jira Cloud (REST v3)   • Semantic Graph Extractor                • 658 Graph Edges
  • Confluence Cloud (REST v2)       • Role-based Permission Filter            • 120+ Entity Nodes
  • SharePoint & Teams (MS Graph)                                                      │
  • ServiceNow (Table API)                                                             ▼
                                                                        [ 10-Rule Readiness & Conflict Engine ]
                                                                        • 10 Deterministic Production Rules
                                                                        • Cross-Source Conflict Detector
                                                                                       │
                                                                                       ▼
  [ React + Vite Frontend (Port 3001) ] ◄─── [ Node.js Express API ] ◄──── [ Google Gemini AI Orchestrator ]
  • Knowledge Graph (Domain Clusters/DAG)    • REST Endpoints (/api/...)   • gemini-3.8-flash
  • 145 Golden Q&A Explorer (/qa)            • Static Asset Hosting        • Multi-hop RAG with Citations
  • 31 Projects Portfolio Matrix             • LangGraph.js Engine
```

### 6 Core Business Domains & 5 Cloud Platforms

| Domain | Projects | Focus & Description |
| :--- | :---: | :--- |
| **🛡️ Cyber Security (`CYB`)** | 7 | SIEM Log Monitoring, Identity & Access Governance, Cloud Posture (CSPM), Vulnerability Management, Security Data Lake, PAM, SOAR Playbooks. |
| **💰 DTFS - Truck Financial Services (`DTFS`)** | 6 | Loan Origination, ML Credit Scoring Engine, Lease & Contract Management, Collections & Servicing, Regulatory Reporting (IFRS 9 / Basel), Dealer Floorplan Financing. |
| **📊 Finance (`FIN`)** | 6 | SAP S/4HANA Finance Core (Central Ledger), Finance Analytics & SAC Dashboards, Group Consolidation & Close, Treasury & Cash Management, Financial Data Mart, Intercompany & Tax. |
| **📦 Procurement (`PRO`)** | 5 | Supplier Portal, SAP Ariba Sourcing & Contracts, Procure-to-Pay Invoice Automation, Spend Analytics, Supplier Risk Scoring ML. |
| **🚚 Sales & Aftersales (`SAL`)** | 6 | Dealer Management Platform, Customer 360 & CRM Data Platform, Aftersales Service Portal, Connected Truck Telematics Streaming, Sales Forecasting & Pricing, Order-to-Delivery. |
| **👥 Human Resources (`HR`)** | 1 | SAP SuccessFactors HR Core (Employee master data, org structure, feeds identity and finance systems). |

**5 Central Cloud Platforms:**
- **Microsoft Azure**: AKS, Sentinel, Log Analytics Workspace, Entra ID, Key Vault, Data Factory, API Management, Defender for Cloud, Azure SQL, Azure Networking.
- **Amazon Web Services (AWS)**: Amazon S3, Amazon EKS, AWS Lambda, Amazon RDS, Amazon Kinesis, Amazon GuardDuty.
- **SAP Business Technology**: SAP S/4HANA Cloud (RISE), SAP Ariba, SAP Analytics Cloud (SAC), SAP BTP Integration Suite, SAP Datasphere, SAP GRC Access Control, SAP SuccessFactors.
- **Snowflake**: Snowflake Data Warehouse, Snowflake Secure Data Sharing, Snowflake Cortex.
- **Databricks**: Databricks Lakehouse, Databricks ML & Model Serving, Databricks Unity Catalog, Delta Live Tables.

---

## 🚀 Step-by-Step Setup Guide (Company Laptop)

### Prerequisites

Make sure you have the following installed:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10, v3.11, or v3.12 ([Download Python](https://www.python.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/jeevan-kp/Company-Brain.git
cd Company-Brain
```

---

### Step 2: Set Up Python Backend & Run Unit Tests

1. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # On macOS / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the automated test suite to verify 100% green status:
   ```bash
   python -m pytest
   ```
   *Expected result: `22 passed in ~0.58s`.*

---

### Step 3: Configure Environment Variables

Create your `.env` file in the root and in `server/`:

```bash
# Copy example configuration
cp server/.env.example server/.env
```

**`server/.env` contents:**
```env
PORT=3001
NODE_ENV=production

# Google Gemini API Key (Required for AI Chat Orchestration)
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Optional: Enterprise Live Instance Credentials (Dual-mode clients use authentic simulation if omitted)
LEANIX_INSTANCE_URL=https://app.leanix.net
LEANIX_API_TOKEN=
JIRA_INSTANCE_URL=https://company-brain.atlassian.net
JIRA_API_TOKEN=
SERVICENOW_INSTANCE_URL=https://service-now.internal
MS_GRAPH_ACCESS_TOKEN=
```

---

### Step 4: Build the Frontend & Start the Server

1. Build the React frontend production bundle:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Start the unified Node.js API server & web application:
   ```bash
   cd ../server
   npm install
   node src/app.js
   ```

3. Open your browser and navigate to:
   👉 **`http://localhost:3001`**

---

## 🖥️ Application Features & Navigation Walkthrough

### 1. 🌌 Semantic Knowledge Graph Explorer (`/graph`)
- **Direct URL**: [`http://localhost:3001/graph`](http://localhost:3001/graph)
- **Layout Switcher**:
  - **🧬 Domain Clusters**: Organizes nodes into regional domain territories with central cloud platforms at the core.
  - **🌳 Architecture Tree**: Hierarchical top-to-bottom DAG view (*Cloud Infrastructure $\to$ Platform Services $\to$ Core Projects $\to$ Downstream Consumers*).
  - **🌌 Force Network**: Anti-collision physics with $-600$ charge repulsion and $45\text{px}$ collision avoidance (eliminates overlapping text).
- **Auto-Aligning Scope Filters**: Click any domain or cloud platform (*Azure, AWS, SAP, Snowflake, Databricks*) to auto-filter and auto-center the camera.
- **Deep Node Inspector Drawer**: Click any node to view semantic context, verified citations, and clickable 1-hop connections for instant graph traversal.

### 2. ⚡ 145 Golden Q&A Benchmarks (`/qa`)
- **Direct URL**: [`http://localhost:3001/qa`](http://localhost:3001/qa)
- **9 Reasoning Categories**:
  - **Impact Analysis (42)**: Outage simulation and cascading blast radius.
  - **Lookups (41)**: Business owners, tech leads, services used, team rosters.
  - **Cross-Domain People (14)**: Staff allocated across multiple business units.
  - **Who to Contact (10)**: Escalation leads and platform owners.
  - **Dependency Chains (10)**: Multi-hop upstream and downstream traces.
  - **Approvals & Governance (10)**: Breaking change approvers and consulted consumers.
  - **Workload & Capacity (11)**: Allocation percentages and multi-project time splits.
  - **Platform Analytics (4)**: Multi-cloud service utilization.
  - **Incident Scenarios (3)**: Detection and containment playbooks.
- **Interactive Action**: Click **"Test in AI Chat"** on any question to execute it live against the Google Gemini orchestrator.

### 3. 💬 AI Query Assistant (`/chat`)
- **Direct URL**: [`http://localhost:3001/chat`](http://localhost:3001/chat)
- Powered by **Google Gemini (`gemini-3.8-flash`)** via `@google/genai`.
- Grounded directly in the AutoNova knowledge graph with verifiable source citations and role-aware permission filters.

### 4. 📊 Enterprise Portfolio Matrix (`/`)
- **Direct URL**: [`http://localhost:3001/`](http://localhost:3001/)
- View all 31 projects across the 6 domains.
- Inspect production readiness scores, failed rules, critical blockers, and cross-source contradictions.
- **Persona Switcher**: Toggle between 5 roles (*Management, Project Manager, Developer, Support/Operations, Architect*).

### 5. 🔌 SAP LeanIX OpenAPI REST & GraphQL Integration
- **Direct URL**: [`http://localhost:3001/api/admin/leanix/factsheets`](http://localhost:3001/api/admin/leanix/factsheets)
- Implements the complete official SAP LeanIX OpenAPI specification with:
  - Data completion KPIs (`completion: 95%`, `subCompletions: header, relations, responsibilities, milestones`).
  - Project milestones & cutover gates.
  - Documents & architecture decision records (ADRs).
  - Subscriptions (`ACCOUNTABLE`, `RESPONSIBLE` roles).
  - Relations (`relApplicationToProject`, `relApplicationToApplication`, `relApplicationToITComponent`).

---

## 🐳 Docker Deployment (Optional)

To run the entire stack inside Docker:

```bash
docker compose up --build
```

Access the application at `http://localhost:3001`.

---

## 🧪 Running Automated Tests

To run the full unit test suite at any time:

```bash
python -m pytest -v
```

**Test Coverage Verified:**
- `tests/test_adapters.py`: Tests LeanIX REST & GraphQL schemas, SharePoint, Teams, ServiceNow, Jira, and Confluence dual-mode adapters.
- `tests/test_models.py`: Validates canonical normalization, entity resolutions, and evidence models.
- `tests/test_permissions.py`: Validates role-based data filtering across 5 personas.
- `tests/test_readiness.py`: Validates 10 deterministic production readiness rules and conflict detection.

---

## 👥 Hackathon Team 20

- **Jeevan** — Solutions Architecture, Semantic Graph Engine, AI Orchestration
- **Praneetha** — Business Scenario, Domain Data & Governance
- **Krish** — Cloud Integrations, UI/UX, Demo Execution

---

*AutoNova Group — Daimler Truck TechHub Hackathon — Team 20*
