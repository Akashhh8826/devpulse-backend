const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { validate, schemas } = require('../middleware/validation');

router.get('/', projectsController.getAllProjects);
router.post('/', validate(schemas.createProject), projectsController.createProject);
router.get('/:id', projectsController.getProjectById);
router.put('/:id', validate(schemas.updateProject), projectsController.updateProject);
router.patch('/:id', validate(schemas.updateProject), projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

module.exports = router;
