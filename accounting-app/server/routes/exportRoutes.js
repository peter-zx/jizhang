const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authMiddleware, distributorOrAdmin, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/members', distributorOrAdmin, exportController.exportMembers);
router.get('/records', distributorOrAdmin, exportController.exportRecords);
router.get('/full-report', adminOnly, exportController.exportFullReport);

module.exports = router;
