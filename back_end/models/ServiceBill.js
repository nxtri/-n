const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceBill = sequelize.define('ServiceBill', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  // Thêm cột này vào trong file model Bill.js của bạn
  billType: {
    type: DataTypes.ENUM('ROOM', 'UTILITY',), // ROOM: Tiền nhà, UTILITY: Điện nước
    allowNull: false,
    defaultValue: 'UTILITY'
  },

  proofImages: { type: DataTypes.TEXT, allowNull: true },
  
  // Các chỉ số chủ nhà sẽ nhập hàng tháng
  electricityUsage: { type: DataTypes.FLOAT, defaultValue: 0 }, // Số ký điện đã dùng
  waterUsage: { type: DataTypes.FLOAT, defaultValue: 0 },       // Số khối nước đã dùng
  vehicleCount: { type: DataTypes.INTEGER, defaultValue: 0 },   // Số lượng xe

  oldElectricity: { type: DataTypes.FLOAT, allowNull: true },
  newElectricity: { type: DataTypes.FLOAT, allowNull: true },
  oldWater: { type: DataTypes.FLOAT, allowNull: true },
  newWater: { type: DataTypes.FLOAT, allowNull: true },
  
  // Tổng tiền do hệ thống tự tính
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  
  // Thêm vào trong define model ServiceBill
roomNumberSnapshot: {
  type: DataTypes.STRING,
  allowNull: true,
  // Cột này có nhiệm vụ "chụp" lại tên phòng ngay tại khoảnh khắc tạo hóa đơn
},
tenantNameSnapshot: {
  type: DataTypes.STRING,
  allowNull: true,
  
},

tenantIdSnapshot: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
landlordIdSnapshot: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

  // Trạng thái hóa đơn
status: {
    type: DataTypes.ENUM('PENDING_LANDLORD', 'UNPAID', 'PAID', 'PENDING_CONFIRM'), 
    defaultValue: 'UNPAID'
},
  contractId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'service_bills',
  timestamps: true
});

module.exports = ServiceBill;