const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, isLandlord, isAdmin } = require('../middlewares/authMiddleware');

// Lấy danh sách gói (Public)
router.get('/plans', subscriptionController.getPlans);

// Chủ nhà mua gói
router.post('/buy', verifyToken, isLandlord, subscriptionController.buyPlan);

// Admin cập nhật cấu hình gói
router.put('/admin/config', verifyToken, isAdmin, subscriptionController.updatePlanConfig);

module.exports = router;
