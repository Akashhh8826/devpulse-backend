const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const authenticateToken = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/', tasksController.getAllTasks);
router.post('/', authenticateToken, validate(schemas.createTask), tasksController.createTask);
router.get('/:id/full', tasksController.getTaskFull);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', authenticateToken, validate(schemas.updateTask), tasksController.updateTask);
router.patch('/:id', authenticateToken, validate(schemas.updateTask), tasksController.updateTask);
router.delete('/:id', authenticateToken, tasksController.deleteTask);

module.exports = router;
