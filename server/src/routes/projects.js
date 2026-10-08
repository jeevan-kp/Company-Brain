const express = require('express');
const router = express.Router();
const db = require('../services/db');
const graphService = require('../services/graphService');
const readinessService = require('../services/readinessService');
const { PROJECTS, getProjectById, getProjectsByDepartment, getProjectGraph } = require('../services/projectsData');

/**
 * GET /api/projects
 * List all projects with optional department filter
 */
router.get('/', async (req, res, next) => {
  try {
    const { department } = req.query;
    
    // Try PostgreSQL
    const { rows } = await db.query(
      department ? 'SELECT * FROM projects WHERE department = $1' : 'SELECT * FROM projects',
      department ? [department] : []
    );
    
    if (rows && rows.length > 0) {
      return res.json(rows);
    }
    
    // Fallback to canonical dataset
    if (department) {
      return res.json(getProjectsByDepartment(department));
    }
    res.json(PROJECTS);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/context
 * Returns unified project context profile via SQL stored procedure
 */
router.get('/:projectId/context', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const role = req.headers['x-user-role'] || req.query.role || req.user?.persona || 'Developer';
    const personId = req.headers['x-person-id'] || req.query.person_id || req.user?.id || null;

    try {
      const { pool } = require('../../../scripts/loaders/db_pool');
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT project_context($1, $2, $3) AS context', [projectId, role, personId]);
        if (!result.rows[0]?.context?.project) {
          return res.status(404).json({ error: `Project ${projectId} not found` });
        }
        return res.json(result.rows[0].context);
      } finally {
        client.release();
      }
    } catch (dbErr) {
      // In-Memory Fallback
      const { projectMap, peopleMap, allocations, projectDependencies, projectServiceUsage } = require('../../../scripts/generators/utils');
      const p = projectMap.get(projectId);
      if (!p) {
        return res.status(404).json({ error: `Project ${projectId} not found` });
      }
      const bo = peopleMap.get(p.business_owner_id) || { name: p.business_owner_id };
      const tl = peopleMap.get(p.tech_lead_id) || { name: p.tech_lead_id };
      const allocs = allocations.filter(a => a.project_id === projectId);
      const deps = projectDependencies.filter(d => d.project_id_consumer === projectId);
      const svcs = projectServiceUsage.filter(s => s.project_id === projectId);

      return res.json({
        project: {
          id: p.project_id,
          name: p.name,
          domain_id: p.domain_id,
          status: p.status,
          business_criticality: p.business_criticality,
          summary: p.description,
          business_owner: { id: p.business_owner_id, name: bo.name },
          tech_lead: { id: p.tech_lead_id, name: tl.name }
        },
        team_raci: allocs.map(a => ({
          person_id: a.person_id,
          name: a.person_name,
          role: a.role_on_project,
          allocation_pct: a.allocation_pct
        })),
        budget: ['Management', 'PM', 'Architect'].includes(role) 
          ? { cost_center: `CC-${p.domain_id}-01`, capex_planned: 3500000, opex_planned: 1225000, variance: 0 }
          : { status: 'RESTRICTED_BY_ROLE' },
        services_used: svcs.map(s => ({ service_id: s.service_id, purpose: s.purpose })),
        dependencies: deps.map(d => ({ provider_id: d.depends_on_project_id_provider, type: d.dependency_type, criticality: d.criticality })),
        open_incidents: [],
        repositories: [{ id: `autonova-group/${p.project_id.toLowerCase()}-core`, name: `${p.project_id.toLowerCase()}-core` }]
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/readiness
 * Get readiness detail with rules and evidence
 */
router.get('/:projectId/readiness', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.readiness || { score: 75, status: 'CONDITIONALLY_READY', rules: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/conflicts
 * Get detected conflicts
 */
router.get('/:projectId/conflicts', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.conflicts || []);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/graph
 * Get project knowledge graph
 */
router.get('/:projectId/graph', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const graph = getProjectGraph(projectId);
    res.json(graph || { nodes: [], links: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/evidence
 * Get all evidence for project
 */
router.get('/:projectId/evidence', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const userRoles = req.user?.roles || ['architect'];
    const evidence = (project.evidence || []).map(ev => {
      const allowed = ev.allowed_roles || [];
      const hasAccess = allowed.some(r => userRoles.includes(r));
      if (!hasAccess) {
        return {
          id: ev.id,
          restricted: true,
          restricted_message: 'A security assessment exists for Project Atlas, but the underlying document is not available under your current access.',
          authority: ev.authority
        };
      }
      return ev;
    });
    
    res.json(evidence);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:projectId/timeline
 * Get project timeline of events
 */
router.get('/:projectId/timeline', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    res.json([
      { date: '2026-10-06', title: 'Architecture conflict detected between ADR-001 and deployment.yaml' },
      { date: '2026-10-04', title: 'ServiceNow critical incident INC0042891 logged for auth defect' },
      { date: '2026-10-02', title: 'Jira issue ATL-6 flagged as critical blocker' },
      { date: '2026-09-20', title: 'SharePoint Security Approval sign-off granted' }
    ]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
