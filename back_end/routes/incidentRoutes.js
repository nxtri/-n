const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Sử dụng upload middleware hiện có

// 1. Dành cho Tenant: Tạo báo cáo sự cố (có upload file, tối đa 5 ảnh)
router.post(
  '/',
  authMiddleware.verifyToken,
  upload.array('images', 5), // 'images' là tên field ở frontend
  incidentController.createIncident
);

// 2. Dành cho cả hai: Lấy danh sách sự cố
router.get(
  '/',
  authMiddleware.verifyToken,
  incidentController.getIncidents
);

// 3. Dành cho Landlord: Cập nhật trạng thái và trả lời sự cố
router.put(
  '/:id',
  authMiddleware.verifyToken,
  incidentController.updateIncident
);

module.exports = router;
