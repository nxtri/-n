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
    type: DataTypes.ENUM('TENANT', 'LANDLORD'), // TENANT: Người thuê, LANDLORD: Người cho thuê
    defaultValue: 'TENANT'
  },
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

}, {
  tableName: 'users',
  timestamps: true // Tự động tạo cột thời gian tạo và cập nhật
});

module.exports = User;