// ============================================================================
// load_base_csv.js — Ingests and enriches all 12 base CSVs into Layer A
// ============================================================================
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool } = require('./db_pool');

async function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
}

async function loadBaseData(client) {
    console.log('📦 Loading Layer A Master Data & Base CSVs...');
    const seedDir = path.join(__dirname, '..', '..', 'seed', 'company_brain');

    // 1. Roles
    const roles = [
        { id: 'ROLE-MGMT', name: 'Management / Executive', category: 'Management', desc: 'Department heads, VPs, Directors and Sponsors' },
        { id: 'ROLE-PM', name: 'Project Manager / Scrum Master', category: 'PM', desc: 'Agile delivery and project planning leads' },
        { id: 'ROLE-DEV', name: 'Software Engineer / Contributor', category: 'Developer', desc: 'Core application and platform developers' },
        { id: 'ROLE-ARCH', name: 'Enterprise / Solution Architect', category: 'Architect', desc: 'System design and architectural governance' },
        { id: 'ROLE-SUPP', name: 'Operations / Support Lead', category: 'Support', desc: 'Site reliability and incident response' }
    ];

    for (const r of roles) {
        await client.query(`
            INSERT INTO role (id, name, category, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description
        `, [r.id, r.name, r.category, r.desc]);
    }

    // 2. Departments
    const departments = [
        { id: 'DEPT-GRP', name: 'AutoNova Group Corporate', level: 'Group', parent_id: null },
        { id: 'DEPT-DIV-IT', name: 'Information Technology & Digital Solutions', level: 'Division', parent_id: 'DEPT-GRP' },
        { id: 'DEPT-DIV-FIN', name: 'Finance & Financial Services', level: 'Division', parent_id: 'DEPT-GRP' },
        { id: 'DEPT-DIV-PRO', name: 'Global Procurement & Supply Chain', level: 'Division', parent_id: 'DEPT-GRP' },
        { id: 'DEPT-DIV-SAL', name: 'Commercial Sales & Marketing', level: 'Division', parent_id: 'DEPT-GRP' },
        { id: 'DEPT-CYB', name: 'Cyber Security & CISO Office', level: 'Department', parent_id: 'DEPT-DIV-IT' },
        { id: 'DEPT-PLAT', name: 'Enterprise Cloud Platforms', level: 'Department', parent_id: 'DEPT-DIV-IT' },
        { id: 'DEPT-DTFS', name: 'Truck Financial Services IT', level: 'Department', parent_id: 'DEPT-DIV-FIN' },
        { id: 'DEPT-FIN', name: 'S/4HANA Finance Systems', level: 'Department', parent_id: 'DEPT-DIV-FIN' },
        { id: 'DEPT-PRO', name: 'Procurement Technologies', level: 'Department', parent_id: 'DEPT-DIV-PRO' },
        { id: 'DEPT-SAL', name: 'Dealer Commercial Systems', level: 'Department', parent_id: 'DEPT-DIV-SAL' },
        { id: 'DEPT-HR', name: 'HR Shared Systems', level: 'Department', parent_id: 'DEPT-GRP' }
    ];

    for (const d of departments) {
        await client.query(`
            INSERT INTO department (id, name, level, parent_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, parent_id = EXCLUDED.parent_id
        `, [d.id, d.name, d.level, d.parent_id]);
    }

    // 3. Cost Centers
    const costCenters = [
        { code: 'CC-CYB-01', name: 'Cyber Security Operations', dept: 'DEPT-CYB', budget: 12500000.00 },
        { code: 'CC-DTFS-01', name: 'Daimler Truck Financial Services IT', dept: 'DEPT-DTFS', budget: 18000000.00 },
        { code: 'CC-FIN-01', name: 'Core Financial Accounting & ERP', dept: 'DEPT-FIN', budget: 25000000.00 },
        { code: 'CC-PRO-01', name: 'Global Sourcing & Supplier IT', dept: 'DEPT-PRO', budget: 14000000.00 },
        { code: 'CC-SAL-01', name: 'Commercial Sales & Dealer IT', dept: 'DEPT-SAL', budget: 16500000.00 },
        { code: 'CC-PLAT-01', name: 'Enterprise Cloud Infrastructure', dept: 'DEPT-PLAT', budget: 32000000.00 },
        { code: 'CC-HR-01', name: 'Human Resources Shared Identity', dept: 'DEPT-HR', budget: 6000000.00 }
    ];

    for (const cc of costCenters) {
        await client.query(`
            INSERT INTO cost_center (code, name, department_id, budget_allocated)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, department_id = EXCLUDED.department_id, budget_allocated = EXCLUDED.budget_allocated
        `, [cc.code, cc.name, cc.dept, cc.budget]);
    }

    // 4. Domains (domains.csv)
    const domainsData = await parseCsv(path.join(seedDir, 'domains.csv'));
    for (const row of domainsData) {
        await client.query(`
            INSERT INTO domain (id, name, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        `, [row.domain_id, row.name, row.description]);
    }

    // 5. Teams (teams.csv)
    const teamsData = await parseCsv(path.join(seedDir, 'teams.csv'));
    for (const row of teamsData) {
        let domainId = null;
        if (['CYB', 'DTFS', 'FIN', 'PRO', 'SAL', 'HR'].includes(row.parent_domain_or_platform)) {
            domainId = row.parent_domain_or_platform;
        }

        let deptId = 'DEPT-DIV-IT';
        if (domainId === 'CYB') deptId = 'DEPT-CYB';
        else if (domainId === 'DTFS') deptId = 'DEPT-DTFS';
        else if (domainId === 'FIN') deptId = 'DEPT-FIN';
        else if (domainId === 'PRO') deptId = 'DEPT-PRO';
        else if (domainId === 'SAL') deptId = 'DEPT-SAL';
        else if (domainId === 'HR') deptId = 'DEPT-HR';
        else if (row.team_type === 'platform') deptId = 'DEPT-PLAT';

        await client.query(`
            INSERT INTO team (id, name, type, domain_id, department_id, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name, 
                type = EXCLUDED.type, 
                domain_id = EXCLUDED.domain_id, 
                department_id = EXCLUDED.department_id, 
                description = EXCLUDED.description
        `, [row.team_id, row.name, row.team_type, domainId, deptId, row.mission]);
    }

    // 6. People (people.csv)
    const peopleData = await parseCsv(path.join(seedDir, 'people.csv'));
    for (const row of peopleData) {
        let roleType = 'Developer';
        const title = (row.job_title || '').toLowerCase();
        if (title.includes('head') || title.includes('director') || title.includes('vp') || title.includes('officer') || title.includes('sponsor')) {
            roleType = 'Management';
        } else if (title.includes('lead') || title.includes('manager') || title.includes('scrum')) {
            roleType = 'PM';
        } else if (title.includes('architect') || title.includes('principal')) {
            roleType = 'Architect';
        } else if (title.includes('support') || title.includes('ops') || title.includes('administrator')) {
            roleType = 'Support';
        }

        let costCenter = 'CC-PLAT-01';
        let deptId = 'DEPT-PLAT';
        const dom = row.domain_or_platform;
        if (dom === 'CYB') { costCenter = 'CC-CYB-01'; deptId = 'DEPT-CYB'; }
        else if (dom === 'DTFS') { costCenter = 'CC-DTFS-01'; deptId = 'DEPT-DTFS'; }
        else if (dom === 'FIN') { costCenter = 'CC-FIN-01'; deptId = 'DEPT-FIN'; }
        else if (dom === 'PRO') { costCenter = 'CC-PRO-01'; deptId = 'DEPT-PRO'; }
        else if (dom === 'SAL') { costCenter = 'CC-SAL-01'; deptId = 'DEPT-SAL'; }
        else if (dom === 'HR') { costCenter = 'CC-HR-01'; deptId = 'DEPT-HR'; }

        await client.query(`
            INSERT INTO person (id, name, email, job_title, role_type, team_id, department_id, cost_center_code, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                job_title = EXCLUDED.job_title,
                role_type = EXCLUDED.role_type,
                team_id = EXCLUDED.team_id,
                department_id = EXCLUDED.department_id,
                cost_center_code = EXCLUDED.cost_center_code,
                location = EXCLUDED.location
        `, [row.person_id, row.name, row.email, row.job_title, roleType, row.primary_team_id, deptId, costCenter, row.location]);

        // Insert primary team membership
        if (row.primary_team_id) {
            await client.query(`
                INSERT INTO team_member (team_id, person_id, role_in_team, is_primary)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (team_id, person_id) DO NOTHING
            `, [row.primary_team_id, row.person_id, row.job_title, true]);
        }
    }

    // Update team leads from teams.csv
    for (const row of teamsData) {
        if (row.team_lead_id) {
            await client.query(`
                UPDATE team SET lead_person_id = $1 WHERE id = $2
            `, [row.team_lead_id, row.team_id]);
        }
    }

    // 7. Platforms & Platform Services (platforms.csv & platform_services.csv)
    const platformsData = await parseCsv(path.join(seedDir, 'platforms.csv'));
    for (const row of platformsData) {
        await client.query(`
            INSERT INTO platform (id, name, description, lead_team_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, lead_team_id = EXCLUDED.lead_team_id
        `, [row.platform_id, row.name, row.description, row.owner_team_id]);
    }

    const servicesData = await parseCsv(path.join(seedDir, 'platform_services.csv'));
    for (const row of servicesData) {
        await client.query(`
            INSERT INTO platform_service (id, platform_id, name, description, owner_team_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET platform_id = EXCLUDED.platform_id, name = EXCLUDED.name, description = EXCLUDED.description, owner_team_id = EXCLUDED.owner_team_id
        `, [row.service_id, row.platform_id, row.name, row.purpose, row.owner_team_id]);
    }

    // Service Dependencies (service_dependencies.csv)
    const serviceDepData = await parseCsv(path.join(seedDir, 'service_dependencies.csv'));
    for (const row of serviceDepData) {
        await client.query(`
            INSERT INTO service_dependency (consumer_service_id, provider_service_id, dependency_type, criticality)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (consumer_service_id, provider_service_id) DO UPDATE SET dependency_type = EXCLUDED.dependency_type, criticality = EXCLUDED.criticality
        `, [row.service_id, row.depends_on_service_id, row.dependency_type || 'infrastructure', row.criticality || 'High']);
    }

    // 8. Strategic Initiatives
    const initiatives = [
        { id: 'INIT-01', name: 'Cloud First 2026', theme: 'Cloud Migration', sponsor: 'E1001', budget: 12500000.00, desc: 'Group-wide migration of on-prem workloads to Azure & AWS Kubernetes landing zones.' },
        { id: 'INIT-02', name: 'Zero Trust Architecture', theme: 'Cyber Defense', sponsor: 'E1024', budget: 8500000.00, desc: 'Identity-driven access control, continuous authentication and microsegmentation.' },
        { id: 'INIT-03', name: 'SAP RISE Transformation', theme: 'ERP Modernization', sponsor: 'E1042', budget: 24000000.00, desc: 'Migration of legacy SAP ECC cores to SAP S/4HANA Cloud (RISE with SAP).' },
        { id: 'INIT-04', name: 'Unified Data Fabric & Lakehouse', theme: 'Analytics & AI', sponsor: 'E1018', budget: 9500000.00, desc: 'Enterprise data consolidation across Snowflake, Databricks Unity Catalog and BTP.' },
        { id: 'INIT-05', name: 'Digital Dealer & Commercial Experience', theme: 'Sales Modernization', sponsor: 'E1070', budget: 6800000.00, desc: 'Omnichannel truck sales, dealer inventory management, and digital warranty claims.' },
        { id: 'INIT-06', name: 'Resilient Supply Chain & Supplier Portal', theme: 'Procurement Resilience', sponsor: 'E1056', budget: 5200000.00, desc: 'Real-time supplier collaboration, Ariba integration and direct material visibility.' }
    ];

    for (const init of initiatives) {
        await client.query(`
            INSERT INTO initiative (id, name, theme, sponsor_person_id, budget, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, theme = EXCLUDED.theme, sponsor_person_id = EXCLUDED.sponsor_person_id, budget = EXCLUDED.budget, description = EXCLUDED.description
        `, [init.id, init.name, init.theme, init.sponsor, init.budget, init.desc]);
    }

    // 9. Projects (projects.csv)
    const projectsData = await parseCsv(path.join(seedDir, 'projects.csv'));
    for (const row of projectsData) {
        let costCenter = 'CC-CYB-01';
        let deptId = 'DEPT-CYB';
        if (row.domain_id === 'CYB') { costCenter = 'CC-CYB-01'; deptId = 'DEPT-CYB'; }
        else if (row.domain_id === 'DTFS') { costCenter = 'CC-DTFS-01'; deptId = 'DEPT-DTFS'; }
        else if (row.domain_id === 'FIN') { costCenter = 'CC-FIN-01'; deptId = 'DEPT-FIN'; }
        else if (row.domain_id === 'PRO') { costCenter = 'CC-PRO-01'; deptId = 'DEPT-PRO'; }
        else if (row.domain_id === 'SAL') { costCenter = 'CC-SAL-01'; deptId = 'DEPT-SAL'; }
        else if (row.domain_id === 'HR') { costCenter = 'CC-HR-01'; deptId = 'DEPT-HR'; }

        const goLiveYear = parseInt(row.go_live_year || '2023', 10);
        const plannedStart = `${goLiveYear - 1}-03-01`;
        const plannedEnd = `${goLiveYear}-11-30`;
        const goLiveDate = `${goLiveYear}-10-15`;

        let phase = 'Operations';
        if (row.status === 'Planned') phase = 'Planning';
        else if (row.status === 'Active') phase = 'Execution';
        else if (row.status === 'Testing') phase = 'Testing';

        await client.query(`
            INSERT INTO project (
                id, name, domain_id, department_id, cost_center_code, status, phase, 
                business_criticality, planned_start, planned_end, go_live_date,
                business_owner_id, tech_lead_id, summary
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                domain_id = EXCLUDED.domain_id,
                department_id = EXCLUDED.department_id,
                cost_center_code = EXCLUDED.cost_center_code,
                status = EXCLUDED.status,
                phase = EXCLUDED.phase,
                business_criticality = EXCLUDED.business_criticality,
                planned_start = EXCLUDED.planned_start,
                planned_end = EXCLUDED.planned_end,
                go_live_date = EXCLUDED.go_live_date,
                business_owner_id = EXCLUDED.business_owner_id,
                tech_lead_id = EXCLUDED.tech_lead_id,
                summary = EXCLUDED.summary
        `, [
            row.project_id, row.name, row.domain_id, deptId, costCenter, 
            row.status || 'Live', phase, row.business_criticality || 'High', 
            plannedStart, plannedEnd, goLiveDate, 
            row.business_owner_id, row.tech_lead_id, row.description
        ]);

        // Link to Initiatives
        let initId = 'INIT-01';
        if (row.domain_id === 'CYB') initId = 'INIT-02';
        else if (row.domain_id === 'FIN') initId = 'INIT-03';
        else if (row.domain_id === 'DTFS') initId = 'INIT-04';
        else if (row.domain_id === 'SAL') initId = 'INIT-05';
        else if (row.domain_id === 'PRO') initId = 'INIT-06';

        await client.query(`
            INSERT INTO project_initiative (project_id, initiative_id)
            VALUES ($1, $2)
            ON CONFLICT (project_id, initiative_id) DO NOTHING
        `, [row.project_id, initId]);

        // Seed Project Budget
        const capex = (row.project_id.startsWith('P-FIN') || row.project_id.startsWith('P-DTFS')) ? 3500000.00 : 1800000.00;
        const opex = capex * 0.35;
        const actual = capex * 0.72;
        const variance = actual - (capex * 0.70);

        await client.query(`
            INSERT INTO project_budget (project_id, fiscal_year, capex_planned, opex_planned, actual_ytd, forecast, variance, cost_center_code, approved_by)
            VALUES ($1, 2026, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (project_id, fiscal_year) DO UPDATE SET
                capex_planned = EXCLUDED.capex_planned,
                opex_planned = EXCLUDED.opex_planned,
                actual_ytd = EXCLUDED.actual_ytd,
                variance = EXCLUDED.variance
        `, [row.project_id, capex, opex, actual, capex * 1.02, variance, costCenter, row.business_owner_id]);
    }

    // 10. Allocations & Project Person (allocations.csv)
    const allocationsData = await parseCsv(path.join(seedDir, 'allocations.csv'));
    for (const row of allocationsData) {
        let raciRole = 'R';
        const roleText = (row.role_on_project || '').toLowerCase();
        if (roleText.includes('owner') || roleText.includes('sponsor')) raciRole = 'A';
        else if (roleText.includes('lead') || roleText.includes('engineer') || roleText.includes('contributor')) raciRole = 'R';
        else if (roleText.includes('architect') || roleText.includes('advisor')) raciRole = 'C';
        else if (roleText.includes('stakeholder') || roleText.includes('sme')) raciRole = 'I';

        await client.query(`
            INSERT INTO project_person (project_id, person_id, role, raci_role, allocation_pct)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (project_id, person_id, role) DO UPDATE SET
                raci_role = EXCLUDED.raci_role,
                allocation_pct = EXCLUDED.allocation_pct
        `, [row.project_id, row.person_id, row.role_on_project, raciRole, parseFloat(row.allocation_pct || '50')]);
    }

    // 11. Project Service Usage (project_service_usage.csv)
    const serviceUsageData = await parseCsv(path.join(seedDir, 'project_service_usage.csv'));
    for (const row of serviceUsageData) {
        await client.query(`
            INSERT INTO project_service_usage (project_id, service_id, purpose, criticality)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (project_id, service_id) DO UPDATE SET purpose = EXCLUDED.purpose, criticality = EXCLUDED.criticality
        `, [row.project_id, row.service_id, row.purpose, 'High']);
    }

    // 12. Project Dependencies (project_dependencies.csv)
    const projectDepData = await parseCsv(path.join(seedDir, 'project_dependencies.csv'));
    for (const row of projectDepData) {
        await client.query(`
            INSERT INTO project_dependency (consumer_id, provider_id, type, criticality, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (consumer_id, provider_id, type) DO UPDATE SET criticality = EXCLUDED.criticality, description = EXCLUDED.description
        `, [row.project_id_consumer, row.depends_on_project_id_provider, row.dependency_type || 'data', row.criticality || 'High', row.description]);
    }

    console.log('✅ Layer A Master Data successfully loaded from base CSVs!');
}

if (require.main === module) {
    (async () => {
        const client = await pool.connect();
        try {
            await loadBaseData(client);
        } catch (err) {
            console.error('❌ Failed to load base CSV data:', err);
            process.exitCode = 1;
        } finally {
            client.release();
            await pool.end();
        }
    })();
}

module.exports = { loadBaseData };
