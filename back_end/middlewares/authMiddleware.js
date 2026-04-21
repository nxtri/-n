const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Chuỗi bí mật này phải giống hệt chuỗi bên file authController.js
const JWT_SECRET = 'Bi_Mat_Cua_Du_An_Phong_Tro_2024'; 

const authMiddleware = {
  // 1. Kiểm tra xem người dùng có thẻ (Token) hợp lệ không
  verifyToken: async (req, res, next) => {
    // Lấy token từ phần Header của request gửi lên (thường có chữ Bearer đứng trước)
    const tokenHeader = req.header('Authorization');
    
    if (!tokenHeader) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập! Vui lòng cung cấp token.' });
    }

    // Tách lấy phần mã token (bỏ chữ 'Bearer ' đi)
    const token = tokenHeader.split(' ')[1];

    try {
      // Giải mã token xem có hợp lệ và còn hạn không
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // KIỂM TRA TRẠNG THÁI TÀI KHOẢN TRONG DATABASE (Đảm bảo đuổi ngay nếu bị khóa)
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại!' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Quản trị viên qua Email: admin@gmail.com hoặc Hotline: 0912.345.678 để được hỗ trợ.' });
      }

      // Lưu thông tin người dùng (id, role) vào req để các bước sau sử dụng
      req.user = decoded; 
      
      // Cho phép đi tiếp đến phần xử lý chính (Controller)
      next(); 
    } catch (error) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
  },

  // 1.5. Kiểm tra mã Token (chấp nhận cả trường hợp không có token)
  verifyTokenOptional: async (req, res, next) => {
    const tokenHeader = req.header('Authorization');
    
    if (!tokenHeader) {
      return next(); // Không có token thì vẫn cho đi tiếp, req.user sẽ là undefined
    }

    const token = tokenHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // KIỂM TRA TRẠNG THÁI TÀI KHOẢN (Nếu có dùng token thì phải là tài khoản đang hoạt động)
      const user = await User.findByPk(decoded.id);
      if (user && user.isActive !== false) {
        req.user = decoded; 
      }
      // Nếu user bị khóa hoặc không tồn tại, req.user sẽ là undefined (coi như khách vãng lai)
      
      next(); 
    } catch (error) {
      next(); // Token lỗi cũng cho đi tiếp như khách vãn lai
    }
  },


  // 2. Kiểm tra xem người dùng có phải là Chủ nhà không
  isLandlord: (req, res, next) => {
    // req.user được lấy từ hàm verifyToken ở trên
    if (req.user && req.user.role.toUpperCase() === 'LANDLORD') {
      next(); // Đúng là chủ nhà, cho đi tiếp
    } else {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này! Chỉ Chủ nhà mới được phép.' });
    }
  },

  // 3. Kiểm tra xem người dùng có phải là Admin không
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role.toUpperCase() === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ message: 'Truy cập bị từ chối! Yêu cầu quyền Quản trị viên.' });
    }
  }
};

module.exports = authMiddleware;