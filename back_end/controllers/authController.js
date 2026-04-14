const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Dùng một chuỗi bí mật để ký tạo Token (Trong thực tế nên để trong file .env)
const JWT_SECRET = 'Bi_Mat_Cua_Du_An_Phong_Tro_2024'; 

const authController = {
  // 1. API Đăng ký (Register)
  register: async (req, res) => {
    try {
      // Lấy thông tin từ client gửi lên
      const { fullName, email, password, role } = req.body;

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await User.findOne({ where: { email: email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã được sử dụng!' });
      }

      // Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Tạo người dùng mới trong database
      const newUser = await User.create({
        fullName: fullName,
        email: email,
        password: hashedPassword,
        role: role || 'TENANT' // Mặc định là người thuê nếu không truyền lên
      });

      res.status(201).json({ 
        message: 'Đăng ký tài khoản thành công!', 
        user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role } 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi đăng ký!' });
    }
  },
  
  // 2. API Đăng nhập (Login)
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Tìm người dùng qua email
      const user = await User.findOne({ where: { email: email } });
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này!' });
      }

      // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu không chính xác!' });
      }

      // Tạo "thẻ ra vào" JWT
      // Gói thông tin id và role vào token, thời hạn 1 ngày (1d)
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      res.status(200).json({
        message: 'Đăng nhập thành công!',
        token: token,
        user: { id: user.id,
          fullName: user.fullName, 
          email: user.email, 
          role: user.role, 
          phone: user.phone,
          identityNumber: user.identityNumber,
          dob: user.dob,
          address: user.address,
          bankName: user.bankName,
          accountNumber: user.accountNumber,
          accountHolder: user.accountHolder }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi đăng nhập!' });
    }
  },

// Cập nhật thông tin người dùng
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id; // Lấy ID từ token bảo mật
      const { fullName, phone, dob, address, identityNumber, bankName, accountNumber, accountHolder } = req.body;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

      // Lưu thông tin mới vào CSDL
      await user.update({ fullName, phone, dob, address, identityNumber, bankName, accountNumber, accountHolder });

      // Trả về thông tin user mới để Frontend cập nhật lại
      const updatedUser = { 
        id: user.id, email: user.email, fullName: user.fullName, role: user.role, 
        phone: user.phone, dob: user.dob, address: user.address, identityNumber: user.identityNumber, bankName: user.bankName, accountNumber: user.accountNumber, accountHolder: user.accountHolder 
      };
      res.status(200).json({ message: 'Cập nhật thành công!', user: updatedUser });
    } 
    catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật!' });
    }
  },
  

  // Hàm Đổi mật khẩu
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

      // Kiểm tra mật khẩu cũ xem có khớp không
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không chính xác!' });

      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Lưu mật khẩu mới vào CSDL
      await user.update({ password: hashedPassword });

      res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu!' });
    }
  },
  // Thêm hàm này vào userController.js
 getUserByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ message: "Vui lòng cung cấp email" });

      // Tìm trong Database
      const user = await User.findOne({ where: { email: email } });
      
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng này" });
      }

      // TRẢ VỀ DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA, CHỌN LỌC CÁC TRƯỜNG CẦN THIẾT
      res.status(200).json({ 
        message: "Tìm thấy người dùng",
        user: {
          fullName: user.fullName,
          phone: user.phone,
          identityNumber: user.identityNumber,
          dob: user.dob,
          address: user.address // Trường address này Frontend sẽ lấy làm Quê quán (Hometown)
        }
      });
    } catch (error) {
      console.error("Lỗi getUserByEmail:", error); // Thêm dòng này để dễ debug nếu có lỗi ngầm
      res.status(500).json({ message: "Lỗi server" });
    }
  }
};
module.exports = authController;