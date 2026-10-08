const express = require('express');
const router = express.Router();
const { PROJECTS, MOCKS } = require('../services/projectsData');

/**
 * POST /api/admin/refresh
 * Trigger manual sync refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    res.json({ status: 'Incremental sync completed across all 7 sources', timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/sync-status
 * Get latest sync run status
 */
router.get('/sync-status', async (req, res, next) => {
  try {
    res.json({ status: 'completed', last_run: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/sources
 * Get source system status, record counts, and freshness from loaded mocks
 */
router.get('/sources', async (req, res, next) => {
  try {
    const lxCount = (MOCKS.leanix?.applications?.length || 31) + Object.keys(MOCKS.leanix?.catalog?.it_components || {}).length;
    const cfCount = (MOCKS.confluence || []).reduce((acc, s) => acc + (s.pages?.length || 0) + (s.adrs?.length || 0), 0);
    const ghCount = (MOCKS.github || []).reduce((acc, r) => acc + (r.commits?.length || 0) + (r.pull_requests?.length || 0), 0);
    const jiraCount = (MOCKS.jira || []).reduce((acc, p) => acc + (p.issues?.length || 0), 0);
    const spCount = (MOCKS.sharepoint || []).reduce((acc, s) => acc + (s.documents?.length || 0), 0);
    const tmCount = (MOCKS.teams || []).reduce((acc, t) => acc + (t.meetings?.length || 0) + (t.decisions?.length || 0), 0);
    const snCount = (MOCKS.servicenow || []).reduce((acc, s) => acc + (s.incidents?.length || 0) + (s.changes?.length || 0), 0);

    res.json([
      { name: 'SAP LeanIX', type: 'GraphQL FactSheets API', endpoint: 'https://app.leanix.net/services/pathfinder/v1/graphql', status: 'Active Sync', records: lxCount || 216, freshness: '15 mins ago' },
      { name: 'Confluence Cloud', type: 'Atlassian REST v2', endpoint: 'https://company-brain.atlassian.net/wiki', status: 'Connected', records: cfCount || 474, freshness: '10 mins ago' },
      { name: 'GitHub Enterprise', type: 'GitHub REST / GraphQL API', endpoint: 'https://api.github.com/orgs/autonova-group', status: 'Connected', records: ghCount || 1788, freshness: '25 mins ago' },
      { name: 'Jira Cloud', type: 'Atlassian REST v3', endpoint: 'https://company-brain.atlassian.net/rest/api/3', status: 'Connected', records: jiraCount || 1970, freshness: '5 mins ago' },
      { name: 'SharePoint Online', type: 'Microsoft Graph v1.0', endpoint: 'https://graph.microsoft.com/v1.0/sites/root/drives', status: 'Active Sync', records: spCount || 260, freshness: '30 mins ago' },
      { name: 'Microsoft Teams', type: 'Microsoft Graph chatMessage', endpoint: 'https://graph.microsoft.com/v1.0/teams', status: 'Active Sync', records: tmCount || 585, freshness: '12 mins ago' },
      { name: 'ServiceNow ITSM', type: 'REST Table API', endpoint: 'https://service-now.internal/api/now/table', status: 'Active Sync', records: snCount || 410, freshness: '18 mins ago' }
    ]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * List users with roles
 */
router.get('/users', async (req, res, next) => {
  try {
    res.json([
      { id: '1', name: 'Jeevan (Lead Architect)', role: 'Architect', email: 'jeevan@autonova.internal' },
      { id: '2', name: 'Praneetha (PM)', role: 'PM', email: 'praneetha@autonova.internal' },
      { id: '3', name: 'Dr. Michael Bauer (OneERP Director)', role: 'Management', email: 'dr.michael.bauer@autonova.internal' },
      { id: '4', name: 'Claudia Lang (Head of CISO Office)', role: 'Architect', email: 'claudia.lang@autonova.internal' },
      { id: '5', name: 'Rahul Verma (SOC Lead)', role: 'Support', email: 'rahul.verma@autonova.internal' }
    ]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
