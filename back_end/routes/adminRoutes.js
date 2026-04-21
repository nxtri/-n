const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ==========================
// QUẢN LÝ NỘI QUY (CHO PHÉP TẤT CẢ USER ĐÃ ĐĂNG NHẬP XEM)
// ==========================
router.get('/regulations', verifyToken, adminController.getRegulations);

// ============================================================
// CÁC ROUTE BÊN DƯỚI ĐỀU YÊU CẦU QUYỀN ADMIN (CHỨC NĂNG QUẢN TRỊ)
// ============================================================
router.use(verifyToken, isAdmin);

// --- THÔNG TIN NGƯỜI DÙNG ---
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// --- GỬI THÔNG BÁO HÀNG LOẠT ---
router.post('/notifications/broadcast', adminController.broadcastNotification);

// --- QUẢN LÝ PHÒNG TRỌ, HỢP ĐỒNG, SỰ CỐ ---
router.get('/rooms', adminController.getAllRooms);
router.put('/rooms/:id/toggle-visibility', adminController.toggleRoomVisibility);
router.get('/contracts', adminController.getAllContracts);
router.get('/incidents', adminController.getAllIncidents);

// --- QUẢN LÝ ĐÁNH GIÁ (REVIEWS) ---
router.get('/rooms/:id/reviews', adminController.getRoomReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// --- QUẢN LÝ BÁO XẤU (REPORTS) ---
router.put('/reports/:id/status', adminController.updateReportStatus);
router.put('/rooms/:id/resolve-reports', adminController.resolveAllRoomReports);

// --- CẬP NHẬT NỘI QUY ---
router.put('/regulations', adminController.updateRegulation);
router.delete('/regulations/:id', adminController.deleteRegulation);

// --- THỐNG KÊ DASHBOARD ---
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
