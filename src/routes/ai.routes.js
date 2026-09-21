const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticateToken = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/suggest-tasks', authenticateToken, validate(schemas.aiSuggest), aiController.suggestTasks);
router.post('/suggest-tasks/accept', authenticateToken, validate(schemas.aiAccept), aiController.acceptTasks);

module.exports = router;
