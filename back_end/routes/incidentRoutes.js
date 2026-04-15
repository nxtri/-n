const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const incidentMessageController = require('../controllers/incidentMessageController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// 1. Dành cho Tenant: Tạo báo cáo sự cố (có upload file, tối đa 5 ảnh)
router.post(
  '/',
  authMiddleware.verifyToken,
  upload.array('images', 5),
  incidentController.createIncident
);

// 2. Dành cho cả hai: Lấy danh sách sự cố
router.get(
  '/',
  authMiddleware.verifyToken,
  incidentController.getIncidents
);

// 3. Chat tin nhắn theo sự cố (ĐẶT TRƯỚC route wildcard /:id)
router.get(
  '/:incidentId/messages',
  authMiddleware.verifyToken,
  incidentMessageController.getMessages
);

router.post(
  '/:incidentId/messages',
  authMiddleware.verifyToken,
  incidentMessageController.sendMessage
);

// 5. Ghi chi phí sửa chữa (cũng đặt trước /:id wildcard)
router.put(
  '/:id/repair-cost',
  authMiddleware.verifyToken,
  incidentController.updateRepairCost
);

// 4. Dành cho Landlord: Cập nhật trạng thái và trả lời sự cố (wildcard, đặt sau)
router.put(
  '/:id',
  authMiddleware.verifyToken,
  incidentController.updateIncident
);

module.exports = router;

