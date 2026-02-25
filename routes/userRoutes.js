// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middlewares
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { logAction } = require('../middleware/audit');

// Protect all user routes: User must be logged in AND have the 'Admin' role
router.use(authenticate);
router.use(authorizeRoles('Admin'));

// CRUD Routes for User Management
router.post('/', logAction('CREATE_USER'), userController.createUser);
router.get('/', logAction('LIST_USERS'), userController.getUsers);
router.get('/:id', logAction('FETCH_USER'), userController.getUserById);
router.put('/:id', logAction('UPDATE_USER'), userController.updateUser);
router.delete('/:id', logAction('DELETE_USER'), userController.deleteUser);

module.exports = router;