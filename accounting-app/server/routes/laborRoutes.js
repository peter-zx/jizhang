const express = require('express');
const router = express.Router();
const laborController = require('../controllers/laborController');
const { authMiddleware, distributorOrAdmin } = require('../middleware/auth');

router.use(authMiddleware);
router.use(distributorOrAdmin);

router.get('/pool', laborController.getMemberPool);
router.post('/pool', laborController.addToPool);
router.get('/tasks', laborController.getLaborTasks);
router.post('/tasks', laborController.createLaborTask);
router.post('/tasks/start', laborController.startTaskForMember);
router.post('/tasks/:taskId/exit', laborController.exitLaborTask);

module.exports = router;
