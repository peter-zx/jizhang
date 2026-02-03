const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/distributors', adminOnly, userController.getDistributors);
router.get('/distributors/:id', adminOnly, userController.getDistributorById);
router.put('/distributors/:id', adminOnly, userController.updateDistributor);
router.get('/logs', userController.getOperationLogs);

module.exports = router;
