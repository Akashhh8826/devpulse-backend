const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { validate, schemas } = require('../middleware/validation');

// Specific endpoints before parameter routes
router.get('/profile', usersController.getUserProfile);
router.put('/profile', validate(schemas.updateUser), usersController.updateUser);
router.patch('/profile', validate(schemas.updateUser), usersController.updateUser);

// Standard CRUD endpoints
router.get('/', usersController.getAllUsers);
router.post('/', validate(schemas.createUser), usersController.createUser);
router.get('/:id', usersController.getUserProfile);
router.put('/:id', validate(schemas.updateUser), usersController.updateUser);
router.patch('/:id', validate(schemas.updateUser), usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
