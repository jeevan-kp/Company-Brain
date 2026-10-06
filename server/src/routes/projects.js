const express = require('express');
const router = express.Router();
const db = require('../services/db');
const graphService = require('../services/graphService');
const readinessService = require('../services/readinessService');
const { PROJECTS, getProjectById, getProjectsByDepartment } = require('../services/projectsData');

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
    res.json(project.graph || { nodes: [], links: [] });
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
