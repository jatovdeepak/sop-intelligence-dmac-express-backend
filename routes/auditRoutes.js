const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Protect audit routes: User must be logged in AND have the 'Admin' role
router.use(authenticate);
router.use(authorizeRoles('Admin'));

// Route to fetch all logs
router.get('/', auditController.getAuditLogs);

module.exports = router;