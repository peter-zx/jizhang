const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { authMiddleware, distributorOrAdmin } = require('../middleware/auth');

router.use(authMiddleware);
router.use(distributorOrAdmin);

router.get('/', accountingController.getRecords);
router.get('/statistics', accountingController.getStatistics);
router.post('/', accountingController.createRecord);
router.post('/clear-all', accountingController.clearAllRecords);
router.put('/:id', accountingController.updateRecord);
router.delete('/:id', accountingController.deleteRecord);

module.exports = router;
