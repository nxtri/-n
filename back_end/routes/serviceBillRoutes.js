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


// Người thuê thanh toán hóa đơn (Cập nhật trạng thái)
// Đường dẫn sẽ có dạng: PUT /api/bills/1/pay (với 1 là ID của hóa đơn)
router.put(
  '/:id/pay', 
  authMiddleware.verifyToken, // Bắt buộc phải đăng nhập mới được thanh toán
  serviceBillController.payBill
);


module.exports = router;