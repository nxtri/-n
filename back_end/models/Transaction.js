const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// === MODEL: GIAO DỊCH TÀI CHÍNH (Transaction) ===
// Lưu lịch sử nạp tiền và mua gói của Chủ nhà
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false // Số tiền giao dịch (VNĐ)
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
    // DEPOSIT: Nạp tiền vào ví
    // SUBSCRIPTION: Mua/Gia hạn gói dịch vụ
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'PENDING'
    // PENDING: Đang chờ Admin duyệt (nạp tiền)
    // APPROVED: Admin đã duyệt
    // REJECTED: Admin từ chối
    // COMPLETED: Giao dịch hoàn tất (mua gói thành công)
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true // Mô tả giao dịch (VD: "Nạp 500.000đ", "Mua gói Vàng 3 tháng")
  },
  proofImage: {
    type: DataTypes.STRING,
    allowNull: true // Đường dẫn ảnh minh chứng chuyển khoản (chỉ dùng cho DEPOSIT)
  }
}, {
  tableName: 'transactions',
  timestamps: true
});

module.exports = Transaction;
