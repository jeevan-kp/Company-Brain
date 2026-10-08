// ============================================================================
// gen_sharepoint.js — SharePoint Business, Governance & Runbook Documents Generator
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, people, heroProjectIds, rng } = require('./utils');

function generateSharePoint() {
    console.log('📄 Generating SharePoint Document Libraries & Deep Runbooks...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'sharepoint');
    fs.mkdirSync(outDir, { recursive: true });

    const sites = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const siteId = `SP-SITE-${p.project_id}`;
        const docs = [];

        // Planted Anomaly ANOM-02: P-FIN-01 Charter budget €4.2M vs DB €3.5M
        let capexBudget = (p.domain_id === 'FIN' || p.domain_id === 'DTFS') ? 3500000.00 : 1800000.00;
        if (p.project_id === 'P-FIN-01') {
            capexBudget = 4200000.00; // Anomaly ANOM-02
        }

        // Planted Anomaly ANOM-04: P-PRO-01 Charter sponsor Marcus Vance (E1008)
        let sponsorId = p.business_owner_id;
        if (p.project_id === 'P-PRO-01') {
            sponsorId = 'E1008'; // Anomaly ANOM-04
        }

        // Planted Anomaly ANOM-10: P-SAL-02 stale docs (>14 months old)
        let docUpdatedDate = '2026-09-15T10:00:00Z';
        if (p.project_id === 'P-SAL-02') {
            docUpdatedDate = '2024-05-10T14:30:00Z'; // Anomaly ANOM-10
        }

        // 1. Project Charter
        docs.push({
            id: `SP-DOC-${p.project_id}-CHARTER`,
            name: `${p.name} — Project Charter & Executive Business Case.docx`,
            doc_type: 'Charter',
            version: '2.1',
            charter_sponsor_person_id: sponsorId,
            charter_budget_capex: capexBudget,
            charter_budget_opex: capexBudget * 0.35,
            author: sponsorId,
            updated_at: docUpdatedDate,
            content_text: `# PROJECT CHARTER: ${p.name.toUpperCase()}\n\n## 1. Executive Summary & Vision\nThe AutoNova Group executive leadership authorizes the ${p.name} program under Domain ${p.domain_id}.\n\n## 2. Business Objectives & Strategic Alignment\n- Objective 1: Modernize automotive operations with real-time digital integration.\n- Objective 2: Establish direct compliance with European data privacy and TISAX cybersecurity standards.\n- Objective 3: Reduce annual maintenance expenditures through cloud platform consolidation.\n\n## 3. Financial Authorization & Budget Envelope\n- Capital Expenditure (Capex) Approved: €${capexBudget.toLocaleString('en-US')}\n- Operating Expenditure (Opex) Annual Baseline: €${(capexBudget * 0.35).toLocaleString('en-US')}\n- Executive Sponsor: ${sponsorId}\n- Cost Center: CC-${p.domain_id}-01\n\n## 4. Key Milestones & Go-Live Schedule\n- Phase 1 Architecture Sign-off: Complete\n- Phase 2 MVP Deployment: Target Go-Live ${p.go_live_year}-10-15\n- Phase 3 Full Rollout across European and North American production plants.`
        });

        // 2. Functional & Technical Specification
        docs.push({
            id: `SP-DOC-${p.project_id}-SPEC`,
            name: `${p.name} — Comprehensive Technical Specification.docx`,
            doc_type: 'Specification',
            version: '3.0',
            author: p.tech_lead_id,
            updated_at: docUpdatedDate,
            content_text: `# TECHNICAL SPECIFICATION: ${p.name}\n\n## 1. System Architecture & Component Interactions\n${p.description}\n\nThe system is engineered around high-availability containerized microservices hosted on Azure Kubernetes Service (AKS). Inter-system messaging utilizes Azure Event Hubs with standard Kafka protocol compliance.\n\n## 2. Security & Identity Integration\nAll endpoints require OAuth 2.0 JSON Web Tokens (JWT) validated against Microsoft Entra ID. RBAC permissions are mapped to corporate SAP authorization objects.\n\n## 3. Data Integrity & Retention\nData persistence layer uses PostgreSQL Flexible Server with automated 35-day point-in-time recovery. Cold storage archives to Azure Blob Storage with immutability policies.`
        });

        // 3. Operational Troubleshooting Runbook (P1 Incidents)
        // Planted Anomaly ANOM-05 on P-SAL-01: Escalation team is T-SAL-LEGACY (obsolete team)
        let escalationTeam = `Platform Operations Support Team`;
        if (p.project_id === 'P-SAL-01') {
            escalationTeam = `Legacy Dealer Systems Unit (Team T-SAL-LEGACY)`; // Anomaly ANOM-05
        }

        docs.push({
            id: `SP-DOC-${p.project_id}-RUNBOOK-P1`,
            name: `${p.name} — P1 Critical Incident Troubleshooting & Triage Runbook.docx`,
            doc_type: 'Runbook',
            version: '4.2',
            author: p.tech_lead_id,
            updated_at: docUpdatedDate,
            content_text: `# PRODUCTION INCIDENT RUNBOOK: ${p.name.toUpperCase()}\n\n## Symptom 1: High API Latency (> 2000ms) or Ingestion Queue Buildup\n### Root Cause Analysis:\n1. Connection pool saturation on backend PostgreSQL database.\n2. Upstream Kafka partition rebalance delay.\n3. Azure AKS node memory pressure causing pod eviction.\n\n### Step-by-Step Remediation Procedure:\n1. Check AKS pod status: \`kubectl get pods -n ${p.project_id.toLowerCase()}\`\n2. Inspect database active connections: verify active connections do not exceed pool threshold.\n3. Scale deployment replicas: \`kubectl scale deployment/${p.project_id.toLowerCase()}-service --replicas=8\`\n4. If latency persists, initiate failover to secondary availability zone.\n\n## Escalation Hierarchy & SLA Matrix:\n- Target Response Time: 15 minutes\n- Target Resolution Time (P1): 4 hours\n- Primary Escalation Contact: ${escalationTeam}\n- Technical Escalation Lead: ${p.tech_lead_id}`
        });

        // 4. Disaster Recovery & Business Continuity Plan
        docs.push({
            id: `SP-DOC-${p.project_id}-DR-PLAN`,
            name: `${p.name} — Disaster Recovery and Business Continuity Guide.docx`,
            doc_type: 'Runbook',
            version: '2.0',
            author: p.tech_lead_id,
            updated_at: docUpdatedDate,
            content_text: `# DISASTER RECOVERY PLAN: ${p.name}\n\n## Recovery Targets\n- Recovery Time Objective (RTO): 4 hours\n- Recovery Point Objective (RPO): 1 hour\n\n## Failover Execution Checklist\n1. Declare Disaster event in ServiceNow Incident bridge.\n2. Update DNS routing records in Azure Traffic Manager to DR Region.\n3. Promote read-replica database to primary status.\n4. Validate end-to-end synthetic health checks.`
        });

        // 5. Risk & Compliance Register
        docs.push({
            id: `SP-DOC-${p.project_id}-RISK-REG`,
            name: `${p.name} — Project Risk Register and TISAX Assessment.xlsx`,
            doc_type: 'RiskRegister',
            version: '1.5',
            author: p.business_owner_id,
            updated_at: docUpdatedDate,
            content_text: `# PROJECT RISK & COMPLIANCE ASSESSMENT\n\n- Risk 01: Third-party API rate limiting on upstream provider.\n  - Severity: Medium | Mitigation: Implement Redis distributed cache.\n- Risk 02: Key personnel allocation constraint during sprint delivery.\n  - Severity: High | Mitigation: Cross-train platform engineers across domains.`
        });

        // 6. End-User Guide
        docs.push({
            id: `SP-DOC-${p.project_id}-USERGUIDE`,
            name: `${p.name} — End-User Operations Manual.pdf`,
            doc_type: 'UserGuide',
            version: '1.2',
            author: p.business_owner_id,
            updated_at: docUpdatedDate,
            content_text: `# END-USER MANUAL: ${p.name}\n\nWelcome to ${p.name}. This document outlines core navigation, role permissions, standard report generation, and exception handling.`
        });

        sites.push({
            site_id: siteId,
            project_id: p.project_id,
            title: `${p.name} SharePoint Team Site`,
            documents: docs
        });
    }

    fs.writeFileSync(path.join(outDir, 'sharepoint_sites.json'), JSON.stringify(sites, null, 2));
    console.log(`✅ Generated ${sites.length} SharePoint sites with long-form Charters, Runbooks & Specs!`);
}

if (require.main === module) {
    generateSharePoint();
}

module.exports = { generateSharePoint };
