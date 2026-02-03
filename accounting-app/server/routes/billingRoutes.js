const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authMiddleware, distributorOrAdmin, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/bills', distributorOrAdmin, billingController.getMonthlyBills);
router.post('/bills/:id/confirm', distributorOrAdmin, billingController.confirmBill);
router.get('/stats/current', distributorOrAdmin, billingController.getCurrentMonthStats);
router.get('/stats/admin-summary', adminOnly, billingController.getAdminDashboardSummary);
router.get('/rent-collection', distributorOrAdmin, billingController.getMonthlyRentCollection);
router.get('/reminders', distributorOrAdmin, billingController.getReminders);
router.post('/reminders/:id/read', distributorOrAdmin, billingController.markReminderRead);
router.post('/reminders/generate', adminOnly, billingController.generateMonthlyReminder);

module.exports = router;
