const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // File cấu hình kết nối Database của bạn

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false // Không được để trống
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Email không được trùng lặp
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('TENANT', 'LANDLORD', 'ADMIN'), // Thêm ADMIN
    defaultValue: 'TENANT'
  },
  isActive: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }, // Trạng thái khóa tài khoản
  phone: { type: DataTypes.STRING, allowNull: true },
  dob: { type: DataTypes.STRING, allowNull: true }, // Ngày sinh
  address: { type: DataTypes.STRING, allowNull: true },
  // identityNumber: { type: DataTypes.STRING, allowNull: true }, // CCCD
  
  identityNumber: { 
    type: DataTypes.STRING(12), 
    allowNull: true 
  }, // Số CCCD 
  

  bankName: { type:DataTypes.STRING, allowNull: true }, 
  accountNumber: { type:DataTypes.STRING, allowNull: true }, 
  accountHolder: { type:DataTypes.STRING, allowNull: true },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  violationsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockGracePeriodStart: { type: DataTypes.DATE, allowNull: true },

  // === HỆ THỐNG VÍ & GÓI ĐĂNG KÝ (SaaS) ===
  balance: { type: DataTypes.FLOAT, defaultValue: 0 }, // Số dư ví (VNĐ)
  subscriptionPlan: {
    type: DataTypes.STRING,
    defaultValue: 'NONE'
    // Giá trị: 'NONE', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND'
  },
  subscriptionExpiry: { type: DataTypes.DATE, allowNull: true }, // Ngày hết hạn gói
  extraRoomLimit: { type: DataTypes.INTEGER, defaultValue: 0 }, // Số lượng phòng gói lẻ mua thêm
  hasBasePlan: { type: DataTypes.BOOLEAN, defaultValue: false } // Đánh dấu có đang xài gói chính không
}, {
  tableName: 'users',
  timestamps: true // Tự động tạo cột thời gian tạo và cập nhật
});

module.exports = User;