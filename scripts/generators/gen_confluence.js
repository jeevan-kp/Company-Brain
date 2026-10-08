// ============================================================================
// gen_confluence.js — Technical Documentation & ADR Mock Generator (Confluence)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, people, heroProjectIds, rng, projectMap } = require('./utils');

function generateConfluence() {
    console.log('📚 Generating Confluence Spaces, Pages, ADRs & Processes...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'confluence');
    fs.mkdirSync(outDir, { recursive: true });

    const spaces = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const spaceKey = `SPACE_${p.project_id.replace(/-/g, '_')}`;

        const pages = [];
        const adrs = [];
        const pocs = [];
        const processes = [];

        // 1. Architecture Overview Page (unless omitted for ANOM-09 on P-FIN-02)
        if (p.project_id !== 'P-FIN-02') {
            pages.push({
                id: `CF-PAGE-${p.project_id}-ARCH`,
                title: `${p.name} — Architecture Overview & Topology`,
                page_type: 'architecture-overview',
                author: p.tech_lead_id,
                version: 4,
                labels: ['architecture', 'topology', 'solution-design', p.domain_id.toLowerCase()],
                body_md: `# Architecture Overview: ${p.name} (${p.project_id})\n\n## 1. System Context\n${p.description}\n\n## 2. Infrastructure Topology\n- Primary Cloud Platform: Microsoft Azure & AWS\n- Container Orchestration: Azure Kubernetes Service (AKS)\n- Data Persistence: PostgreSQL Flexible Server & Enterprise Lakehouse\n\n## 3. High Availability & Security\nMulti-zone redundancy active across West Europe and Central India regions. Ingestion TLS 1.3 enforced.`
            });
        }

        // 2. Solution Design Page
        pages.push({
            id: `CF-PAGE-${p.project_id}-DES`,
            title: `${p.name} — Solution Design & API Specifications`,
            page_type: 'solution-design',
            author: p.tech_lead_id,
            version: 3,
            labels: ['api', 'spec', 'design'],
            body_md: `# Solution Design Document\n\n## API Protocols\nRESTful HTTPS JSON API compliant with OpenAPI 3.1 specifications. OAuth 2.0 Bearer tokens issued via Microsoft Entra ID.`
        });

        // 3. Operational Runbook & SOP Page
        pages.push({
            id: `CF-PAGE-${p.project_id}-RUN`,
            title: `${p.name} — Technical Runbook & Triage Procedures`,
            page_type: 'runbook',
            author: p.tech_lead_id,
            version: 2,
            labels: ['runbook', 'operations', 'incident-response'],
            body_md: `# Operational Runbook\n\n## Escalation Matrix\n1. Level 1: Central Service Desk\n2. Level 2: Platform Reliability Team\n3. Level 3: Tech Lead (${p.tech_lead_id})`
        });

        // 4. Financial & Cost Center Allocation Page
        pages.push({
            id: `CF-PAGE-${p.project_id}-BUDGET`,
            title: `${p.name} — Cost Center & Budget Planning FY2026`,
            page_type: 'budget',
            author: p.business_owner_id,
            version: 2,
            labels: ['finance', 'budget', 'cost-center'],
            body_md: `# Budget & Cost Allocation FY2026\n\n- Cost Center: CC-${p.domain_id}-01\n- Business Owner: ${p.business_owner_id}\n- Capex Allocation: €${isHero ? '3,500,000' : '1,800,000'}\n- Approved by Executive Board.`
        });

        // 5. Standard Process Page
        processes.push({
            id: `PROC-${p.project_id}-01`,
            name: `${p.name} Release & Deployment Workflow`,
            process_type: 'CI/CD Deployment Gate',
            steps: '1. PR Review -> 2. SonarQube Quality Gate -> 3. Automated Integration Tests -> 4. Blue-Green Production Deployment'
        });

        // 6. ADRs
        adrs.push({
            id: `ADR-${p.project_id}-001`,
            title: `ADR-001: Adoption of PostgreSQL Flexible Server for Relational Storage`,
            status: 'Accepted',
            context: `The project requires ACID-compliant relational transactions with automatic point-in-time recovery.`,
            decision: `Adopt PostgreSQL 16+ on Azure Flexible Server.`,
            consequences: `Ensures standard SQL schema migrations and automated backups.`,
            chosen_technology: 'PostgreSQL Flexible Server',
            decided_by: p.tech_lead_id
        });

        adrs.push({
            id: `ADR-${p.project_id}-002`,
            title: `ADR-002: Service-to-Service Communication Protocol`,
            status: 'Accepted',
            context: `High-frequency inter-service data exchanges require standard contract definitions.`,
            decision: `Use asynchronous event publishing via Kafka/Event Hubs for loose coupling.`,
            consequences: `Consumers must implement idempotent message processing.`,
            chosen_technology: 'Apache Kafka / Event Hubs',
            decided_by: p.tech_lead_id
        });

        // Planted Anomaly ANOM-03: P-CYB-01 chose Rust in ADR, but code uses Python/Go
        if (p.project_id === 'P-CYB-01') {
            adrs.push({
                id: `ADR-P-CYB-01-003`,
                title: `ADR-003: Core Stream Processing Engine Language Selection`,
                status: 'Accepted',
                context: `Log ingestion throughput requires sub-millisecond latency and zero garbage collection pauses.`,
                decision: `Mandate Rust as the exclusive implementation language for all log collector agents.`,
                consequences: `Highest memory efficiency and safety; all team members must complete Rust training.`,
                chosen_technology: 'Rust (tokio / actix)',
                decided_by: p.tech_lead_id
            });
        }

        // Additional Hero Project Pages & POCs
        if (isHero) {
            pages.push({
                id: `CF-PAGE-${p.project_id}-PERF`,
                title: `${p.name} — Performance Benchmarking & Load Testing`,
                page_type: 'solution-design',
                author: p.tech_lead_id,
                version: 1,
                labels: ['performance', 'benchmarks', 'load-testing'],
                body_md: `# Performance Benchmark Results\n\nTested at 15,000 requests/sec with p99 response time under 45ms.`
            });

            pocs.push({
                id: `POC-${p.project_id}-01`,
                title: `POC: Vector Search Retrieval on Enterprise Catalogs`,
                hypothesis: `Hybrid semantic search combines keyword and vector embeddings with >90% precision.`,
                tech_stack: 'pgvector + pg_trgm + OpenAI text-embedding-3-small',
                results: 'Retrieval accuracy improved by 34% over purely lexical search.',
                recommendation: 'Adopt',
                conducted_by: p.tech_lead_id
            });
        }

        spaces.push({
            space_key: spaceKey,
            project_id: p.project_id,
            name: `${p.name} Documentation Space`,
            description: `Official Confluence engineering and architecture space for ${p.name}`,
            pages,
            adrs,
            pocs,
            processes
        });
    }

    fs.writeFileSync(path.join(outDir, 'confluence_spaces.json'), JSON.stringify(spaces, null, 2));
    console.log(`✅ Generated ${spaces.length} Confluence spaces with rich technical pages, ADRs and POCs!`);
}

if (require.main === module) {
    generateConfluence();
}

module.exports = { generateConfluence };
