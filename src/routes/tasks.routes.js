const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { validate, schemas } = require('../middleware/validation');

router.get('/', tasksController.getAllTasks);
router.post('/', validate(schemas.createTask), tasksController.createTask);
router.get('/:id/full', tasksController.getTaskFull);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', validate(schemas.updateTask), tasksController.updateTask);
router.patch('/:id', validate(schemas.updateTask), tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
