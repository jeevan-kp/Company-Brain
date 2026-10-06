# Company Brain — Connected Knowledge. Trusted Answers. Real Project Insight.

> From fragmented information to a living, permission-aware Company Brain.

[![CI/CD](https://github.com/TechHub-hackathon/hackathon-team-20/actions/workflows/ci.yaml/badge.svg)](https://github.com/TechHub-hackathon/hackathon-team-20/actions)

## What Is Company Brain?

Company Brain builds a **continuously updated semantic knowledge graph** from fragmented project information. It connects projects, applications, people, decisions, issues, documents, dependencies, meetings, incidents, and changes. Users ask questions, get production readiness, and detect contradictions — with the latest permitted evidence from multiple source systems.

### Two Core Features

1. **Ask the live knowledge graph with evidence** — Grounded answers with citations to Jira, Confluence, GitHub, and more
2. **Detect gaps and cross-source contradictions** — When architecture decisions don't match implementation

## Architecture

```
Enterprise Data Sources → Adapters & Ingestion → Semantic Knowledge Layer (PostgreSQL 17 + pgvector)
                                                         ↓
                                               Business Logic (Readiness + Conflicts + Permissions)
                                                         ↓
                                               AI Orchestration (LangGraph)
                                                         ↓
                                               API Layer (Node.js + Express)
                                                         ↓
                                               React Frontend
```

### Data Sources

| Source | Type | Provides |
|--------|------|----------|
| Jira Cloud | Real | Issues, epics, blockers |
| Confluence Cloud | Real | Decisions, architecture docs |
| GitHub | Real | Code, releases, deployment configs |
| LeanIX | Mock | Applications, interfaces |
| SharePoint | Mock | Governance documents |
| Teams/Meetings | Mock | Discussions, action items |
| ServiceNow | Mock | Incidents, changes |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- PostgreSQL 17 (via Docker)

### Local Development

```bash
# 1. Clone and setup
git clone <repo-url>
cd company_brain

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start PostgreSQL with Docker
docker compose up db -d

# 4. Initialize database
psql -h localhost -U company_brain -d company_brain -f database/schema.sql

# 5. Install Python dependencies
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# 6. Seed demo data
python scripts/seed_atlas.py
python scripts/seed_all_projects.py

# 7. Start API server
cd server && npm install && npm run dev

# 8. Start React frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 — you should see the Enterprise View with ~20 projects.

### Docker (Full Stack)

```bash
docker compose up --build
```

## Project Structure

```
company_brain/
├── config/                    # projects.yaml, source_bindings.yaml
├── data/                      # Synthetic demo data (JSON fixtures)
├── mock_sources/              # Mock enterprise data (LeanIX, SharePoint, Teams, ServiceNow)
├── company_brain/             # Python backend
│   ├── adapters/              # 7 source adapters (3 real + 4 mock)
│   ├── models/                # Pydantic data models
│   ├── graph/                 # Graph traversal (recursive CTEs)
│   ├── rules/                 # Readiness engine (10 rules) + conflict detection (3 patterns)
│   ├── permissions/           # Role-aware filtering
│   ├── workflow/              # LangGraph orchestration
│   └── scheduler/             # Background sync jobs
├── server/                    # Node.js + Express API
├── frontend/                  # React + Vite + Tailwind frontend
├── database/                  # PostgreSQL schema
├── tests/                     # Test suite
├── scripts/                   # Seed, reset, utility scripts
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yaml        # Local development stack
└── .github/workflows/         # CI/CD pipeline
```

## Team 20

- **Jeevan** — Architecture, AI, Graph
- **Praneetha** — Business Scenario & Data
- **Krish** — Integrations, UI, Demo

---

*Daimler Truck — TechHub Hackathon — Team 20*
