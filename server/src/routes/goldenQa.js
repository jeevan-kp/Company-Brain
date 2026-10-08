const express = require('express');
const router = express.Router();
const { GOLDEN_QA } = require('../services/projectsData');

/**
 * GET /api/golden-qa
 * List golden Q&A benchmarks with optional filters
 */
router.get(['/', '/prompts'], async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;
    let results = [...GOLDEN_QA];

    if (category) {
      results = results.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }

    if (difficulty) {
      results = results.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(item => 
        item.question.toLowerCase().includes(q) || 
        item.golden_answer.toLowerCase().includes(q) ||
        item.entities_used.toLowerCase().includes(q)
      );
    }

    res.json({
      total: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/golden-qa/categories
 * Get summary breakdown across 9 categories
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categoriesMap = {};
    GOLDEN_QA.forEach(item => {
      const cat = item.category || 'other';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { category: cat, count: 0, sample: item.question };
      }
      categoriesMap[cat].count += 1;
    });

    res.json(Object.values(categoriesMap));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/golden-qa/:id
 * Get single Q&A by ID (e.g. Q001, Q052)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = GOLDEN_QA.find(q => q.qa_id.toUpperCase() === req.params.id.toUpperCase());
    if (!item) {
      return res.status(404).json({ error: 'Golden Q&A not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
