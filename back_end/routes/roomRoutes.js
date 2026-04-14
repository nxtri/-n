const express = require('express');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // <--- PHẢI CÓ DÒNG NÀY ĐỂ GỌI MULTER

const router = express.Router();

// Route lấy phòng cho trang chủ (Gồm Trống + Sắp trống)
router.get('/public', roomController.getPublicRooms);
// Khách vãn lai xem danh sách phòng
router.get('/', authMiddleware.verifyTokenOptional, roomController.getAllRooms);

// Khách vãn lai xem chi tiết 1 phòng
router.get('/:id', roomController.getRoomById);
router.put('/:id/deposit', authMiddleware.verifyToken, authMiddleware.isLandlord, roomController.updateDeposit);
// Chủ nhà tạo phòng mới (CÓ NHẬN ẢNH)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isLandlord, 
  upload.array('images', 15), // <--- CHỐT CHẶN BẮT ẢNH NẰM Ở ĐÂY
  roomController.createRoom
);

// Chủ nhà đổi trạng thái phòng (Trống <-> Đang sửa)
router.put('/:id/status', authMiddleware.verifyToken, authMiddleware.isLandlord, roomController.updateStatus);
// Chủ nhà Sửa thông tin phòng (CÓ NHẬN ẢNH)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isLandlord, upload.array('images', 15), roomController.updateRoom);

// Chủ nhà Xóa phòng
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isLandlord, roomController.deleteRoom);
module.exports = router;