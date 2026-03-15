const express = require('express');
const router = express.Router();
const sopController = require('../controllers/sopController');

const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { checkSOPState } = require('../middleware/conditions');
const { logAction } = require('../middleware/audit');

// Apply authentication to all SOP routes
router.use(authenticate);

router.get('/', logAction('LIST_SOPS'), sopController.getSOPs);
router.get('/:id', logAction('FETCH_SOP'), checkSOPState, sopController.getSOPById);
router.get('/:id/pdf', logAction('DOWNLOAD_PDF'), checkSOPState, sopController.downloadSOPPdf);

router.post('/', 
    authorizeRoles('Creator', 'Admin'), 
    // REMOVED: uploadSOPFile.single('pdf')
    logAction('CREATE_SOP'), 
    sopController.createSOP
);

router.delete('/:id', 
    authorizeRoles('Creator', 'Admin'), 
    logAction('DELETE_SOP'), 
    sopController.deleteSOP
);

router.put('/:id', 
    authorizeRoles('Creator', 'Admin'), 
    // REMOVED: uploadSOPFile.single('pdf')
    logAction('UPDATE_SOP'), 
    sopController.updateSOP
);

module.exports = router;