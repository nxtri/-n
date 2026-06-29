const express = require('express');
const router = express.Router();
const serviceBillController = require('../controllers/serviceBillController');
const authMiddleware = require('../middlewares/authMiddleware');

// Chỉ Chủ nhà mới được tạo hóa đơn
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isLandlord, 
  serviceBillController.createBill
);

// Bất kỳ ai đăng nhập cũng có thể xem hóa đơn
router.get(
  '/', 
  authMiddleware.verifyToken, 
  serviceBillController.getAllBills
);


// Chủ nhà xác nhận đã nhận tiền hóa đơn (Cập nhật trạng thái)
// Đường dẫn sẽ có dạng: PUT /api/bills/1/pay (với 1 là ID của hóa đơn)
router.put(
  '/:id/pay', 
  authMiddleware.verifyToken, // Bắt buộc phải đăng nhập mới được thanh toán
  authMiddleware.isLandlord,
  serviceBillController.payBill
);

router.put(
  '/:id/reject-proof',
  authMiddleware.verifyToken,
  authMiddleware.isLandlord,
  serviceBillController.rejectProof
);

// Cập nhật hóa đơn điện nước (Chỉ dành cho chủ nhà và trạng thái UNPAID)
router.put(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLandlord,
  serviceBillController.updateBill
);

// Xóa hóa đơn điện nước (Chỉ dành cho chủ nhà và trạng thái UNPAID)
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLandlord,
  serviceBillController.deleteBill
);

module.exports = router;
