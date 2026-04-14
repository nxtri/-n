const express = require('express');
const router = express.Router();
const serviceBillController = require('../controllers/serviceBillController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/', authMiddleware.verifyToken, authMiddleware.isLandlord, serviceBillController.createBill);
router.get('/', authMiddleware.verifyToken, serviceBillController.getAllBills);
router.put('/:id/pay', authMiddleware.verifyToken, serviceBillController.payBill); // Tuyến đường thanh toán
// 🚨 Thêm route này để khách upload ảnh (Cho phép up nhiều ảnh, field name là 'proofs', tối đa 3 ảnh)
router.post('/:id/upload-proof', authMiddleware.verifyToken, upload.array('proofs', 3), serviceBillController.uploadProof);
module.exports = router;