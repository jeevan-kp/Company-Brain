const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');

/**
 * GET /api/graph/global or /api/graph/enterprise
 * Get complete enterprise semantic knowledge graph across all projects & systems
 */
router.get('/global', async (req, res, next) => {
  try {
    const graph = await graphService.getEnterpriseGraph();
    res.json(graph);
  } catch (err) {
    next(err);
  }
});

router.get('/enterprise', async (req, res, next) => {
  try {
    const graph = await graphService.getEnterpriseGraph();
    res.json(graph);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/graph/department/:dept
 * Get department-scoped graph
 */
router.get('/department/:dept', async (req, res, next) => {
  try {
    const { dept } = req.params;
    const graph = await graphService.getDepartmentGraph(dept);
    res.json(graph);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/graph/subgraph/:entityId
 * Get subgraph around entity
 */
router.get('/subgraph/:entityId', async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const { depth = 2 } = req.query;
    const subgraph = await graphService.getSubgraph(entityId, parseInt(depth, 10));
    res.json(subgraph);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/graph/paths
 * Find paths between two entities
 */
router.get('/paths', async (req, res, next) => {
  try {
    const { source, target } = req.query;
    if (!source || !target) {
      return res.status(400).json({ error: 'source and target query params required' });
    }
    const globalGraph = await graphService.getEnterpriseGraph();
    res.json({ paths: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/graph/search
 * Search entities by name/type
 */
router.get('/search', async (req, res, next) => {
  try {
    const { query, type } = req.query;
    const results = await graphService.searchEntities(query, type);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/graph/entity/:entityId
 * Get entity with all evidence and relationships
 */
router.get('/entity/:entityId', async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const entity = await graphService.getEntityWithEvidence(entityId, req.user?.roles || []);
    res.json(entity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
