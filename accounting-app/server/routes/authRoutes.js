const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// 公开路由
router.post('/login', authController.login);
router.post('/register', authController.register);

// 需要认证的路由
router.get('/me', authMiddleware, authController.getCurrentUser);

// 仅管理员
router.post('/invite-codes', authMiddleware, adminOnly, authController.generateInviteCode);
router.get('/invite-codes', authMiddleware, adminOnly, authController.getInviteCodes);

module.exports = router;
