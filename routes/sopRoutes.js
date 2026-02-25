const express = require('express');
const router = express.Router();
const sopController = require('../controllers/sopController');

const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { checkSOPState } = require('../middleware/conditions');
const { logAction } = require('../middleware/audit');
const { uploadSOPFile } = require('../middleware/upload');

// Apply authentication to all SOP routes
router.use(authenticate);

// Routes
router.get('/', logAction('LIST_SOPS'), sopController.getSOPs);

router.get('/:id', logAction('FETCH_SOP'), checkSOPState, sopController.getSOPById);

router.get('/:id/pdf', logAction('DOWNLOAD_PDF'), checkSOPState, sopController.downloadSOPPdf);

router.post('/', 
    authorizeRoles('Creator', 'Admin'), 
    uploadSOPFile.single('pdf'), 
    logAction('CREATE_SOP'), 
    sopController.createSOP
);

module.exports = router;