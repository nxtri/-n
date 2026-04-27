const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { verifyToken, isLandlord, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// =========================================================
// ROUTES CHO CHỦ NHÀ (LANDLORD)
// =========================================================
// Nạp tiền (kèm ảnh minh chứng)
router.post('/deposit', verifyToken, isLandlord, upload.single('proofImage'), walletController.createDeposit);
// Xem lịch sử giao dịch
router.get('/transactions', verifyToken, isLandlord, walletController.getMyTransactions);
// Xem thông tin ví (số dư, gói hiện tại)
router.get('/my-wallet', verifyToken, isLandlord, walletController.getMyWallet);
// Lấy thông tin ngân hàng Admin (để hiện QR)
router.get('/admin-bank-info', verifyToken, isLandlord, walletController.getAdminBankInfo);

// =========================================================
// ROUTES CHO ADMIN
// =========================================================
// Lấy tất cả giao dịch
router.get('/admin/transactions', verifyToken, isAdmin, walletController.getAllTransactions);
// Duyệt nạp tiền
router.put('/admin/approve/:id', verifyToken, isAdmin, walletController.approveDeposit);
// Từ chối nạp tiền
router.put('/admin/reject/:id', verifyToken, isAdmin, walletController.rejectDeposit);
// Lấy thông tin ngân hàng (Admin cũng cần xem)
router.get('/admin/bank-info', verifyToken, isAdmin, walletController.getAdminBankInfo);
// Cấu hình ngân hàng nhận tiền
router.put('/admin/bank-info', verifyToken, isAdmin, walletController.updateAdminBankInfo);

module.exports = router;
