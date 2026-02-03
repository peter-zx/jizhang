const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authMiddleware, distributorOrAdmin } = require('../middleware/auth');

router.use(authMiddleware);
router.use(distributorOrAdmin);

router.get('/', memberController.getMembers);
router.get('/expiring', memberController.getExpiringDocuments);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

module.exports = router;
