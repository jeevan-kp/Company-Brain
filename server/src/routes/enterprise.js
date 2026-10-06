const express = require('express');
const router = express.Router();
const { PROJECTS, getDepartments } = require('../services/projectsData');

/**
 * GET /api/enterprise
 * Enterprise overview
 */
router.get('/', async (req, res, next) => {
  try {
    const departments = getDepartments();
    const readyCount = PROJECTS.filter(p => p.readiness?.status === 'READY').length;
    const condCount = PROJECTS.filter(p => p.readiness?.status === 'CONDITIONALLY_READY').length;
    const notReadyCount = PROJECTS.filter(p => p.readiness?.status === 'NOT_READY').length;
    
    const avgScore = Math.round(PROJECTS.reduce((acc, p) => acc + (p.readiness?.score || 70), 0) / PROJECTS.length);

    res.json({
      departments_count: departments.length,
      total_projects: PROJECTS.length,
      overall_readiness: avgScore,
      ready_projects: readyCount,
      conditionally_ready_projects: condCount,
      not_ready_projects: notReadyCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/departments
 * List departments with project counts, risk summary
 */
router.get('/departments', async (req, res, next) => {
  try {
    res.json(getDepartments());
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/departments/:department
 * Department detail
 */
router.get('/departments/:department', async (req, res, next) => {
  try {
    const { department } = req.params;
    const projects = PROJECTS.filter(p => p.department.toLowerCase() === department.toLowerCase());
    res.json({
      department,
      project_count: projects.length,
      projects
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/kpis
 * Portfolio-level KPIs
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const kpis = {
      projects_at_risk: 3,
      blocking_conflicts: 3,
      open_critical_incidents: 2,
      readiness_distribution: [
        { name: 'Ready', value: 9, color: '#10b981' },
        { name: 'Conditionally Ready', value: 10, color: '#f59e0b' },
        { name: 'Not Ready', value: 1, color: '#ef4444' }
      ]
    };
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
