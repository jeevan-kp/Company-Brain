// ============================================================================
// load_teams.js — Ingests Teams Channels, Meetings, Decisions into Layer B & D
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadTeams(client) {
    console.log('💬 Loading Teams Collaboration Data into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'teams', 'teams_channels.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Teams data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const channels = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const chan of channels) {
        await client.query(`
            INSERT INTO tm_channel (id, project_id, name, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        `, [chan.id, chan.project_id, chan.name, chan.description]);

        // Meetings
        for (const mtg of (chan.meetings || [])) {
            const sourceItemId = await upsertSourceItem(client, 'teams', mtg.id, chan.project_id, mtg, mtg.meeting_date);

            await client.query(`
                INSERT INTO tm_meeting (id, project_id, channel_id, title, meeting_type, organizer_person_id, meeting_date, duration_minutes, summary)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary
            `, [mtg.id, chan.project_id, chan.id, mtg.title, mtg.meeting_type, mtg.organizer_person_id, mtg.meeting_date, mtg.duration_minutes, mtg.summary]);

            // Decisions
            for (const dec of (mtg.decisions || [])) {
                await client.query(`
                    INSERT INTO tm_decision (id, meeting_id, project_id, decision_text, rationale, impact_level, decided_by_person_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET decision_text = EXCLUDED.decision_text, rationale = EXCLUDED.rationale
                `, [dec.id, mtg.id, chan.project_id, dec.decision_text, dec.rationale, dec.impact_level, dec.decided_by_person_id]);
            }

            // Action Items
            for (const act of (mtg.action_items || [])) {
                await client.query(`
                    INSERT INTO tm_action_item (id, meeting_id, description, assignee_person_id, due_date, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description, status = EXCLUDED.status
                `, [act.id, mtg.id, act.description, act.assignee_person_id, act.due_date, act.status]);
            }

            // Index Meeting & Decisions into Document
            await upsertDocument(client, {
                project_id: chan.project_id,
                source_system: 'teams',
                source_item_id: sourceItemId,
                external_id: mtg.id,
                title: mtg.title,
                doc_type: 'meeting-notes',
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: mtg.organizer_person_id,
                updated_at: mtg.meeting_date,
                raw_text: `# Meeting Notes: ${mtg.title}\n\nDate: ${mtg.meeting_date}\nOrganizer: ${mtg.organizer_person_id}\n\nSummary:\n${mtg.summary}\n\nDecisions Recorded:\n${(mtg.decisions || []).map(d => `- ${d.decision_text} (Rationale: ${d.rationale})`).join('\n')}`,
                metadata: { meeting_type: mtg.meeting_type }
            });
        }

        // Messages
        for (const msg of (chan.messages || [])) {
            await client.query(`
                INSERT INTO tm_message (id, channel_id, author_person_id, content)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
            `, [msg.id, chan.id, msg.author_person_id, msg.content]);
        }
    }

    console.log('✅ Teams Layer B & D Data loaded successfully!');
}

module.exports = { loadTeams };
