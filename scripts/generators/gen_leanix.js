// ============================================================================
// gen_leanix.js — Enterprise Architecture Mock Generator (LeanIX)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, projectDependencies, people, heroProjectIds, rng } = require('./utils');

const itComponentCatalog = [
    { id: 'ITC-K8S-128', name: 'Azure Kubernetes Service (AKS)', category: 'runtime', vendor: 'Microsoft', version: '1.28.5', eol: '2025-11-01', cost: 12000 },
    { id: 'ITC-K8S-122', name: 'Kubernetes Cluster Engine', category: 'runtime', vendor: 'Cloud Native', version: '1.22.15', eol: '2022-10-28', cost: 8000 }, // EOL Anomaly
    { id: 'ITC-PG-16', name: 'Azure Database for PostgreSQL Flexible', category: 'database', vendor: 'Microsoft / PostgreSQL', version: '16.2', eol: '2028-11-09', cost: 18500 },
    { id: 'ITC-SAP-S4', name: 'SAP S/4HANA Cloud Private Edition', category: 'runtime', vendor: 'SAP SE', version: '2023 FPS02', eol: '2030-12-31', cost: 240000 },
    { id: 'ITC-SAP-BTP', name: 'SAP Business Technology Platform', category: 'middleware', vendor: 'SAP SE', version: 'Cloud 2024.1', eol: '2029-01-01', cost: 45000 },
    { id: 'ITC-KAFKA-AZ', name: 'Azure Event Hubs Kafka Surface', category: 'middleware', vendor: 'Microsoft', version: '3.4.0', eol: '2027-06-30', cost: 15000 },
    { id: 'ITC-NODE-20', name: 'Node.js LTS Runtime', category: 'runtime', vendor: 'OpenJS Foundation', version: '20.11.1', eol: '2026-04-30', cost: 0 },
    { id: 'ITC-JAVA-21', name: 'Eclipse Temurin OpenJDK', category: 'runtime', vendor: 'Adoptium', version: '21.0.2', eol: '2029-09-30', cost: 0 },
    { id: 'ITC-SPRING-3', name: 'Spring Boot Framework', category: 'framework', vendor: 'VMware', version: '3.2.3', eol: '2026-11-24', cost: 0 },
    { id: 'ITC-SNOW-EDW', name: 'Snowflake Enterprise Data Warehouse', category: 'database', vendor: 'Snowflake Inc.', version: '8.12', eol: '2029-12-31', cost: 85000 },
    { id: 'ITC-DBX-LAKE', name: 'Databricks Runtime with Unity Catalog', category: 'middleware', vendor: 'Databricks', version: '14.3 LTS', eol: '2027-02-28', cost: 65000 },
    { id: 'ITC-REDIS-7', name: 'Azure Cache for Redis', category: 'database', vendor: 'Microsoft', version: '7.0', eol: '2026-10-31', cost: 7200 }
];

const businessCapabilities = [
    { id: 'CAP-L1-FIN', name: 'Financial Management', level: 'L1', parent_id: null },
    { id: 'CAP-L2-ACC', name: 'General Ledger & Financial Accounting', level: 'L2', parent_id: 'CAP-L1-FIN' },
    { id: 'CAP-L2-TRE', name: 'Treasury & Liquidity Management', level: 'L2', parent_id: 'CAP-L1-FIN' },
    { id: 'CAP-L1-CYB', name: 'Cyber Security & Resilience', level: 'L1', parent_id: null },
    { id: 'CAP-L2-SOC', name: 'Threat Detection & Incident Response', level: 'L2', parent_id: 'CAP-L1-CYB' },
    { id: 'CAP-L2-IAM', name: 'Identity Governance & Access Assurance', level: 'L2', parent_id: 'CAP-L1-CYB' },
    { id: 'CAP-L1-SAL', name: 'Commercial Sales & Distribution', level: 'L1', parent_id: null },
    { id: 'CAP-L2-DMS', name: 'Dealer Network & Order Fulfillment', level: 'L2', parent_id: 'CAP-L1-SAL' },
    { id: 'CAP-L1-PRO', name: 'Strategic Sourcing & Procurement', level: 'L1', parent_id: null },
    { id: 'CAP-L2-SUP', name: 'Supplier Relationship & Ariba Integration', level: 'L2', parent_id: 'CAP-L1-PRO' },
    { id: 'CAP-L1-DTFS', name: 'Captive Financial Services', level: 'L1', parent_id: null },
    { id: 'CAP-L2-LOAN', name: 'Commercial Lending & Risk Scoring', level: 'L2', parent_id: 'CAP-L1-DTFS' }
];

function generateLeanIX() {
    console.log('🏗️ Generating LeanIX Mock Architecture Fact Sheets...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'leanix');
    fs.mkdirSync(outDir, { recursive: true });

    const applications = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const appId = `LX-APP-${p.project_id}`;

        // Planted Anomaly ANOM-01: P-DTFS-01 is marked 'active' lifecycle
        let currentPhase = 'active';
        if (p.status === 'Planned') currentPhase = 'plan';
        else if (p.status === 'Active' && p.project_id !== 'P-DTFS-01') currentPhase = 'phase_in';

        const lifecycle = {
            app_id: appId,
            plan_date: `${parseInt(p.go_live_year || '2023') - 1}-01-15`,
            phase_in_date: `${parseInt(p.go_live_year || '2023') - 1}-08-01`,
            active_date: `${parseInt(p.go_live_year || '2023')}-03-01`,
            phase_out_date: `${parseInt(p.go_live_year || '2023') + 5}-12-31`,
            end_of_life_date: `${parseInt(p.go_live_year || '2023') + 7}-12-31`,
            current_phase: currentPhase
        };

        // Planted Anomaly ANOM-04: P-PRO-01 owner discrepancy
        let appOwner = p.business_owner_id;
        if (p.project_id === 'P-PRO-01') {
            appOwner = 'E1014'; // Ravi Menon instead of Marcus Vance
        }

        const subscriptions = [
            { person_id: appOwner, role_type: 'Application Owner' },
            { person_id: p.tech_lead_id, role_type: 'Technical Lead' }
        ];

        // IT Components
        const components = [itComponentCatalog[0], itComponentCatalog[2], itComponentCatalog[6]];
        if (p.domain_id === 'FIN') components.push(itComponentCatalog[3], itComponentCatalog[4]);
        if (p.domain_id === 'CYB') components.push(itComponentCatalog[5]);
        if (isHero) components.push(itComponentCatalog[7], itComponentCatalog[8], itComponentCatalog[11]);

        // Planted Anomaly ANOM-07: P-PRO-01 uses EOL Kubernetes v1.22
        if (p.project_id === 'P-PRO-01') {
            components.push(itComponentCatalog[1]); // ITC-K8S-122
        }

        // Data Objects
        const dataObjects = [
            {
                id: `DO-${p.project_id}-CORE`,
                name: `${p.name} Master Business Entity`,
                sensitivity: 'Internal',
                contains_pii: false,
                retention_period_months: 84,
                last_security_review: '2025-08-15'
            },
            {
                id: `DO-${p.project_id}-AUDIT`,
                name: `${p.name} Transaction Log`,
                sensitivity: 'Confidential',
                contains_pii: true,
                retention_period_months: 120,
                last_security_review: '2025-11-20'
            }
        ];

        // Planted Anomaly ANOM-08: P-DTFS-02 has PII object with NO security review
        if (p.project_id === 'P-DTFS-02') {
            dataObjects.push({
                id: `DO-${p.project_id}-CREDIT-SCORE`,
                name: 'Customer Credit Risk & Scoring Profile',
                sensitivity: 'Restricted',
                contains_pii: true,
                retention_period_months: 60,
                last_security_review: null // Anomaly ANOM-08
            });
        }

        // Interfaces (from project_dependencies.csv)
        const outgoingDeps = projectDependencies.filter(d => d.depends_on_project_id_provider === p.project_id);
        const incomingDeps = projectDependencies.filter(d => d.project_id_consumer === p.project_id);

        const interfaces = [];
        for (const dep of incomingDeps) {
            interfaces.push({
                id: `IF-${dep.project_id_consumer}-${dep.depends_on_project_id_provider}`,
                provider_app_id: `LX-APP-${dep.depends_on_project_id_provider}`,
                consumer_app_id: `LX-APP-${dep.project_id_consumer}`,
                name: `${dep.project_id_consumer} consumes ${dep.depends_on_project_id_provider}`,
                protocol: dep.dependency_type === 'data' ? 'REST' : 'Kafka',
                direction: 'Inbound',
                frequency: 'Real-time',
                data_objects: `${dep.depends_on_project_id_provider} Master Feed`,
                description: dep.description
            });
        }

        // Planted Anomaly ANOM-11: P-CYB-01 contains unmapped interface to P-SAL-01
        if (p.project_id === 'P-CYB-01') {
            interfaces.push({
                id: 'IF-P-CYB-01-P-SAL-01-UNREGISTERED',
                provider_app_id: 'LX-APP-P-CYB-01',
                consumer_app_id: 'LX-APP-P-SAL-01',
                name: 'Direct Kafka SIEM Event Sync to Dealer Management',
                protocol: 'Kafka',
                direction: 'Outbound',
                frequency: 'Real-time',
                data_objects: 'Dealer Security Telemetry',
                description: 'Unregistered real-time event pipeline for dealer security audits'
            });
        }

        // Capabilities mapping
        let capId = 'CAP-L2-SOC';
        if (p.domain_id === 'FIN') capId = 'CAP-L2-ACC';
        else if (p.domain_id === 'DTFS') capId = 'CAP-L2-LOAN';
        else if (p.domain_id === 'SAL') capId = 'CAP-L2-DMS';
        else if (p.domain_id === 'PRO') capId = 'CAP-L2-SUP';
        else if (p.domain_id === 'CYB' && p.project_id === 'P-CYB-02') capId = 'CAP-L2-IAM';

        const appFactSheet = {
            id: appId,
            project_id: p.project_id,
            name: p.name,
            alias: `APP-${p.project_id}`,
            description: p.description,
            application_type: 'Business Application',
            hosting_type: p.domain_id === 'FIN' ? 'Hybrid' : 'Cloud Private',
            business_criticality: p.business_criticality === 'critical' ? 'Mission Critical' : 'Business Critical',
            functional_fit: 'Appropriate',
            technical_fit: 'Appropriate',
            time_classification: 'Invest',
            sla_percentage: 99.95,
            rto_hours: 4,
            rpo_hours: 1,
            user_count: isHero ? 4500 : 850,
            annual_run_cost: isHero ? 450000 : 120000,
            data_quality_pct: 96.5,
            compliance: {
                gdpr: true,
                sox: p.domain_id === 'FIN',
                iso27001: true,
                tisax: true
            },
            lifecycle,
            subscriptions,
            capabilities: [capId],
            components: components.map(c => ({ id: c.id, environment: 'Production' })),
            data_objects: dataObjects,
            interfaces,
            tags: [
                { tag_group: 'Domain', tag_value: p.domain_id },
                { tag_group: 'CloudTier', tag_value: 'Tier-1-Enterprise' },
                { tag_group: 'CostCenter', tag_value: `CC-${p.domain_id}-01` }
            ]
        };

        applications.push(appFactSheet);
    }

    const payload = {
        catalog: {
            capabilities: businessCapabilities,
            it_components: itComponentCatalog
        },
        applications
    };

    fs.writeFileSync(path.join(outDir, 'leanix_factsheets.json'), JSON.stringify(payload, null, 2));
    console.log(`✅ Generated ${applications.length} LeanIX application fact sheets with all dependencies & anomalies!`);
}

if (require.main === module) {
    generateLeanIX();
}

module.exports = { generateLeanIX };
