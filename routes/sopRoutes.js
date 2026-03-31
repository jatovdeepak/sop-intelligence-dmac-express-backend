const express = require('express');
const router = express.Router();
const sopController = require('../controllers/sopController');

const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { checkSOPState } = require('../middleware/conditions');
const { logAction } = require('../middleware/audit');

router.get('/summary', logAction('FETCH_RAG_SUMMARY'), sopController.getSOPSummary);
// Apply authentication to all SOP routes
router.use(authenticate);

// --- NEW OPTIMIZED ROUTES ---
// Must go BEFORE /:id to prevent Express from treating "metadata" as an ID param
router.get('/metadata', logAction('LIST_SOP_METADATA'), sopController.getAllSOPMetadata);
router.get('/:id/metadata', logAction('FETCH_SOP_METADATA'), sopController.getSOPMetaDataById);
router.get('/:id/data', logAction('FETCH_SOP_DATA'), sopController.getSOPDataById);
router.get('/:id/pdf-base64', logAction('FETCH_SOP_BASE64'), sopController.getSOPPdfBase64ById);


// --- EXISTING ROUTES ---
router.get('/', logAction('LIST_SOPS'), sopController.getSOPs);
router.get('/:id', logAction('FETCH_SOP'), checkSOPState, sopController.getSOPById);
router.get('/:id/pdf', logAction('DOWNLOAD_PDF'), checkSOPState, sopController.downloadSOPPdf);

router.post('/', 
    authorizeRoles('Creator', 'Admin'), 
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
    logAction('UPDATE_SOP'), 
    sopController.updateSOP
);

module.exports = router;