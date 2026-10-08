// ============================================================================
// gen_teams.js — Microsoft Teams Channels, Meetings, Decisions & Action Items
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, people, heroProjectIds, rng } = require('./utils');

function generateTeams() {
    console.log('💬 Generating Microsoft Teams Channels, Meetings, Decisions & Action Items...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'teams');
    fs.mkdirSync(outDir, { recursive: true });

    const allChannels = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const channelId = `TM-CHAN-${p.project_id}-GEN`;

        const meetings = [];
        const meetingCount = isHero ? 8 : 4;

        for (let m = 1; m <= meetingCount; m++) {
            const meetingId = `MTG-${p.project_id}-${m.toString().padStart(2, '0')}`;
            const meetingType = (m === 1) ? 'Steering Committee' : ((m === 2) ? 'Architecture Review' : 'Sprint Planning');
            const meetingDate = new Date(Date.parse('2026-09-01T10:00:00Z') + (m * 7 * 86400000)).toISOString();

            const decisions = [
                {
                    id: `DEC-${meetingId}-01`,
                    decision_text: `Approved standard zero-downtime rolling update strategy for ${p.name}.`,
                    rationale: `Minimizes impact on plant operations during shift changes.`,
                    impact_level: 'High',
                    decided_by_person_id: p.business_owner_id
                }
            ];

            const actionItems = [
                {
                    id: `ACT-${meetingId}-01`,
                    description: `Conduct load test simulation at 1.5x peak dealer transaction volume.`,
                    assignee_person_id: p.tech_lead_id,
                    due_date: '2026-10-15',
                    status: 'In Progress'
                }
            ];

            meetings.push({
                id: meetingId,
                title: `${p.name} — Weekly ${meetingType} #${m}`,
                meeting_type: meetingType,
                organizer_person_id: p.tech_lead_id,
                meeting_date: meetingDate,
                duration_minutes: 45,
                summary: `Reviewed progress on ${p.name}, evaluated risk mitigations and aligned on milestone sign-offs.`,
                decisions,
                action_items: actionItems
            });
        }

        const messages = [
            {
                id: `MSG-${p.project_id}-001`,
                author_person_id: p.tech_lead_id,
                content: `Team, the latest sprint release has passed security vulnerability scanning with zero critical findings.`
            },
            {
                id: `MSG-${p.project_id}-002`,
                author_person_id: p.business_owner_id,
                content: `Great work. Let's ensure the operational runbook and escalation paths are updated before the steering review.`
            }
        ];

        allChannels.push({
            id: channelId,
            project_id: p.project_id,
            name: `${p.name} — General Engineering Channel`,
            description: `Core collaboration channel for ${p.name} project team`,
            meetings,
            messages
        });
    }

    fs.writeFileSync(path.join(outDir, 'teams_channels.json'), JSON.stringify(allChannels, null, 2));
    console.log(`✅ Generated ${allChannels.length} Teams channels with meetings, decisions & action items!`);
}

if (require.main === module) {
    generateTeams();
}

module.exports = { generateTeams };
