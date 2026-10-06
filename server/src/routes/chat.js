const express = require('express');
const router = express.Router();
const queryWorkflow = require('../workflow/queryWorkflow');

/**
 * POST /api/chat
 * Submit a question, returns grounded answer with citations
 */
router.post('/', async (req, res, next) => {
  try {
    const { question, persona, project_context } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const user = {
      ...req.user,
      persona: persona || req.user.persona
    };

    const result = await queryWorkflow.answerQuestion(user, question, project_context);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
