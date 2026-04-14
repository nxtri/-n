const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); //


// SỬA ROUTE TẠO HỢP ĐỒNG: Cho phép nhiều trường gửi file cùng lúc
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isLandlord, 
  upload.fields([
    { name: 'contractImages', maxCount: 5 },
    { name: 'conditionImages', maxCount: 10 },
    { name: 'conditionVideos', maxCount: 5 }
  ]), 
  contractController.createContract
);

router.get('/', authMiddleware.verifyToken, contractController.getAllContracts);
// ... (Các đoạn require ở đầu file giữ nguyên)

// [THÊM MỚI] API cho Khách thuê xem hợp đồng của chính họ
router.get('/my-contract', authMiddleware.verifyToken, contractController.getMyContract);
// Lấy danh sách đánh giá của tôi
router.get('/my-reviews', authMiddleware.verifyToken, contractController.getMyReviews);

// [THÊM MỚI] API cho Khách thuê tải ảnh minh chứng Tạm trú (Dùng upload.single vì chỉ cần 1 ảnh minh chứng)
router.put('/my-contract/:id/residence', authMiddleware.verifyToken, upload.array('residenceImages'), contractController.updateResidenceProof);
// Nếu đang dùng upload.array(...) hay upload.single(...), hãy đổi thành upload.any()
router.post('/', authMiddleware.verifyToken, upload.any(), contractController.createContract);
router.put('/:id', authMiddleware.verifyToken, upload.any(), contractController.updateContract);
// Route báo trước trả phòng
router.post('/:id/notice-terminate', authMiddleware.verifyToken, contractController.requestTermination);
router.post('/:id/review', authMiddleware.verifyToken, upload.array('reviewImages', 5), contractController.submitReview);
router.put('/review/:id/reply', authMiddleware.verifyToken, contractController.replyToReview);
// Route cập nhật hợp đồng
router.put('/:id', authMiddleware.verifyToken, upload.fields([
  { name: 'contractImages', maxCount: 5 },
  { name: 'conditionImages', maxCount: 10 },
  { name: 'conditionVideos', maxCount: 5 }
]), contractController.updateContract);
// Route HỦY báo trước trả phòng
router.put('/:id/cancel-terminate', authMiddleware.verifyToken, contractController.cancelTermination);
// Kết thúc hợp đồng
router.put('/:id/end', authMiddleware.verifyToken, contractController.endContract);

module.exports = router;