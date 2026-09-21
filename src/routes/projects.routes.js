const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const authenticateToken = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/', projectsController.getAllProjects);
router.post('/', authenticateToken, validate(schemas.createProject), projectsController.createProject);
router.get('/:id', projectsController.getProjectById);
router.put('/:id', authenticateToken, validate(schemas.updateProject), projectsController.updateProject);
router.patch('/:id', authenticateToken, validate(schemas.updateProject), projectsController.updateProject);
router.delete('/:id', authenticateToken, projectsController.deleteProject);

module.exports = router;
