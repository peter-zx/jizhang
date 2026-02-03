const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, adminOnly, adminOrDistributorA } = require('../middleware/auth');

// 公开路由
router.post('/login', authController.login);
router.post('/register', authController.register);

// 需要认证的路由
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);

// 邀请码管理 (管理员或A层分销)
router.post('/invite-codes', authMiddleware, adminOrDistributorA, authController.generateInviteCode);
router.get('/invite-codes', authMiddleware, adminOrDistributorA, authController.getInviteCodes);

module.exports = router;
