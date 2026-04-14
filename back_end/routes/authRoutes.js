const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
// Khai báo đường dẫn cho Đăng ký và Đăng nhập
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', authMiddleware.verifyToken, authController.updateProfile);
// Thay đổi mật khẩu (Yêu cầu phải có token đăng nhập)
router.put('/change-password', authMiddleware.verifyToken, authController.changePassword);
router.get('/user/by-email', authController.getUserByEmail);
module.exports = router;
