// ============================================================================
// gen_all_mocks.js — Orchestrator for all 7 synthetic mock data generators
// ============================================================================
const { generateLeanIX } = require('./gen_leanix');
const { generateConfluence } = require('./gen_confluence');
const { generateSharePoint } = require('./gen_sharepoint');
const { generateGitHub } = require('./gen_github');
const { generateJira } = require('./gen_jira');
const { generateTeams } = require('./gen_teams');
const { generateServiceNow } = require('./gen_servicenow');

function generateAllMocks() {
    console.log('🚀 Starting Enterprise Synthetic Data Generation Pipeline (7 Sources, 31 Projects)...');
    console.time('Generation Pipeline Duration');

    generateLeanIX();
    generateConfluence();
    generateSharePoint();
    generateGitHub();
    generateJira();
    generateTeams();
    generateServiceNow();

    console.timeEnd('Generation Pipeline Duration');
    console.log('✨ Synthetic data generation completed successfully for all 7 sources!');
}

if (require.main === module) {
    generateAllMocks();
}

module.exports = { generateAllMocks };
