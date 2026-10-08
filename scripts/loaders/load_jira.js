// ============================================================================
// load_jira.js — Ingests Jira Projects, Sprints, Epics & Issues into Layer B & D
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadJira(client) {
    console.log('🎯 Loading Jira Data into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'jira', 'jira_projects.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Jira data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const projects = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const proj of projects) {
        await client.query(`
            INSERT INTO jira_project (key, project_id, name, lead_person_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, lead_person_id = EXCLUDED.lead_person_id
        `, [proj.project_key, proj.project_id, proj.name, proj.lead_person_id]);

        // Sprints
        for (const sprint of (proj.sprints || [])) {
            await client.query(`
                INSERT INTO jira_sprint (id, jira_project_key, name, state, start_date, end_date, goal, velocity_points)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, goal = EXCLUDED.goal
            `, [sprint.id, proj.project_key, sprint.name, sprint.state, sprint.start_date, sprint.end_date, sprint.goal, sprint.velocity_points]);
        }

        // Issues
        for (const issue of (proj.issues || [])) {
            const sourceItemId = await upsertSourceItem(client, 'jira', issue.key, proj.project_id, issue);

            await client.query(`
                INSERT INTO jira_issue (
                    key, jira_project_key, project_id, sprint_id, issue_type, summary, 
                    description, status, priority, story_points, reporter_person_id, assignee_person_id, epic_key
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (key) DO UPDATE SET
                    summary = EXCLUDED.summary,
                    status = EXCLUDED.status,
                    priority = EXCLUDED.priority,
                    assignee_person_id = EXCLUDED.assignee_person_id
            `, [
                issue.key, proj.project_key, proj.project_id, issue.sprint_id, issue.issue_type,
                issue.summary, issue.description, issue.status, issue.priority, issue.story_points,
                issue.reporter_person_id, issue.assignee_person_id, issue.epic_key
            ]);

            // Index Epics and high priority issues into document
            if (issue.issue_type === 'Epic' || issue.priority === 'High' || issue.priority === 'Highest') {
                await upsertDocument(client, {
                    project_id: proj.project_id,
                    source_system: 'jira',
                    source_item_id: sourceItemId,
                    external_id: issue.key,
                    title: `[${issue.key}] ${issue.summary}`,
                    doc_type: 'jira_issue',
                    sensitivity: 'internal',
                    allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                    author: issue.reporter_person_id,
                    url_mock: `https://autonova.atlassian.net/browse/${issue.key}`,
                    raw_text: `Issue Key: ${issue.key}\nType: ${issue.issue_type}\nStatus: ${issue.status}\nPriority: ${issue.priority}\nSummary: ${issue.summary}\n\nDescription: ${issue.description}`,
                    metadata: { issue_key: issue.key, issue_type: issue.issue_type, status: issue.status }
                });
            }
        }

        // Links
        for (const link of (proj.issue_links || [])) {
            await client.query(`
                INSERT INTO jira_issue_link (source_issue_key, target_issue_key, link_type)
                VALUES ($1, $2, $3)
                ON CONFLICT (source_issue_key, target_issue_key, link_type) DO NOTHING
            `, [link.source_issue_key, link.target_issue_key, link.link_type]);
        }
    }

    console.log('✅ Jira Layer B & D Data loaded successfully!');
}

module.exports = { loadJira };
