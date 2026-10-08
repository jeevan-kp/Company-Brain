// ============================================================================
// gen_jira.js — Agile Sprints, Epics, Stories, Bugs & Issue Links (Jira Cloud)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, projectDependencies, people, heroProjectIds, rng } = require('./utils');

function generateJira() {
    console.log('🎯 Generating Jira Cloud Projects, Sprints, Epics & Issues...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'jira');
    fs.mkdirSync(outDir, { recursive: true });

    const jiraProjects = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const cleanCode = p.project_id.replace(/^P-/, '').replace(/-/g, '');
        const projectKey = cleanCode.toUpperCase();

        const sprints = [
            {
                id: `SPRINT-${projectKey}-01`,
                jira_project_key: projectKey,
                name: `${projectKey} Sprint 24.1 — Foundation`,
                state: 'closed',
                start_date: '2026-08-01T09:00:00Z',
                end_date: '2026-08-15T18:00:00Z',
                goal: 'Establish baseline API endpoints and schema migrations.',
                velocity_points: 38
            },
            {
                id: `SPRINT-${projectKey}-02`,
                jira_project_key: projectKey,
                name: `${projectKey} Sprint 24.2 — Integration`,
                state: 'closed',
                start_date: '2026-08-16T09:00:00Z',
                end_date: '2026-08-31T18:00:00Z',
                goal: 'Connect to upstream data providers and implement Kafka producers.',
                velocity_points: 42
            },
            {
                id: `SPRINT-${projectKey}-03`,
                jira_project_key: projectKey,
                name: `${projectKey} Sprint 24.3 — Hardening & Security`,
                state: 'active',
                start_date: '2026-09-01T09:00:00Z',
                end_date: '2026-09-15T18:00:00Z',
                goal: 'Security vulnerability remediation, performance load testing and runbook validation.',
                velocity_points: 45
            }
        ];

        const issues = [];
        const links = [];

        // Epic 1
        const epic1Key = `${projectKey}-100`;
        // Anomaly ANOM-01: P-DTFS-01 has open in-progress epic
        const epic1Status = (p.project_id === 'P-DTFS-01') ? 'In Progress' : 'Done';

        issues.push({
            key: epic1Key,
            jira_project_key: projectKey,
            project_id: p.project_id,
            sprint_id: `SPRINT-${projectKey}-01`,
            issue_type: 'Epic',
            summary: `Core Enterprise Integration Engine & Data Pipelines for ${p.name}`,
            description: `Deliver end-to-end streaming integration for ${p.name} with compliance guarantees.`,
            status: epic1Status,
            priority: 'High',
            story_points: 21,
            reporter_person_id: p.business_owner_id,
            assignee_person_id: p.tech_lead_id,
            epic_key: null
        });

        const issueCount = isHero ? 60 : 30;
        for (let i = 1; i <= issueCount; i++) {
            const issueKey = `${projectKey}-${100 + i}`;
            const isBug = (i % 7 === 0);
            const issueType = isBug ? 'Bug' : 'Story';
            const status = (i > issueCount - 5) ? 'In Progress' : 'Done';

            issues.push({
                key: issueKey,
                jira_project_key: projectKey,
                project_id: p.project_id,
                sprint_id: (i < 15) ? `SPRINT-${projectKey}-01` : ((i < 35) ? `SPRINT-${projectKey}-02` : `SPRINT-${projectKey}-03`),
                issue_type: issueType,
                summary: `${isBug ? '[BUG] Fix' : 'Implement'} telemetry processing step #${i} for ${p.name}`,
                description: `Detailed task description for ${p.name} component. Ensure unit test coverage > 85%.`,
                status: status,
                priority: isBug ? 'High' : 'Medium',
                story_points: isBug ? 3 : 5,
                reporter_person_id: p.business_owner_id,
                assignee_person_id: p.tech_lead_id,
                epic_key: epic1Key
            });

            if (i > 1 && i % 4 === 0) {
                links.push({
                    source_issue_key: issueKey,
                    target_issue_key: `${projectKey}-${100 + i - 1}`,
                    link_type: 'Depends On'
                });
            }
        }

        jiraProjects.push({
            project_key: projectKey,
            project_id: p.project_id,
            name: `${p.name} Delivery Board`,
            lead_person_id: p.tech_lead_id,
            sprints,
            issues,
            issue_links: links
        });
    }

    fs.writeFileSync(path.join(outDir, 'jira_projects.json'), JSON.stringify(jiraProjects, null, 2));
    console.log(`✅ Generated ${jiraProjects.length} Jira projects with sprints, epics, issues and blockers!`);
}

if (require.main === module) {
    generateJira();
}

module.exports = { generateJira };
