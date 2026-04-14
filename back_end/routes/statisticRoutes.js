const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statisticController');
const authMiddleware = require('../middlewares/authMiddleware');

// Chỉ Chủ nhà mới được xem thống kê doanh thu
// Đường dẫn: GET /api/statistics/revenue?year=2024
router.get(
  '/revenue', 
  authMiddleware.verifyToken, 
  authMiddleware.isLandlord, 
  statisticController.getRevenueByYear
);

module.exports = router;