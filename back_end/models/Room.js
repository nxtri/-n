const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // Thông tin cơ bản & Địa chỉ
  roomNumber: { type: DataTypes.STRING, allowNull: false },
  roomCode: { type: DataTypes.STRING, allowNull: true, unique: true },
  houseNumber: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true }, // Xã, Thành phố
  roomType: { 
    type: DataTypes.ENUM('SINGLE', 'WHOLE_HOUSE'), 
    defaultValue: 'SINGLE' 
  },
  
  // Thông tin giá cả
  price: { type: DataTypes.FLOAT, allowNull: false },
  electricityPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  waterPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  internetPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  parkingPrice: { type: DataTypes.FLOAT, defaultValue: 0 }, // Giá trông xe / 1 chiếc
  servicePrice: { type: DataTypes.FLOAT, defaultValue: 0 }, // Dọn rác, thang máy...
  
  // Sức chứa & Tiện ích (Boolean: true/false)
  maxOccupants: { type: DataTypes.INTEGER, defaultValue: 1 },
  hasElevator: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasWashingMachine: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasFridge: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasKitchen: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasHeater: { type: DataTypes.BOOLEAN, defaultValue: false }, // Nóng lạnh
  area: { type: DataTypes.FLOAT, allowNull: true },
  numFloors: { type: DataTypes.INTEGER, allowNull: true },
  numBedrooms: { type: DataTypes.INTEGER, allowNull: true },
  numBathrooms: { type: DataTypes.INTEGER, allowNull: true },
  images: { type: DataTypes.TEXT, allowNull: true },
  description: {type: DataTypes.TEXT, allowNull: true },
  depositNote: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    // Dùng để ghi chú thông tin người cọc (VD: "Anh Hưng cọc 2 triệu, sđt 098... mùng 5 dọn vào")
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'RENTED', 'MAINTENANCE'), 
    defaultValue: 'AVAILABLE'
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  landlordId: { type: DataTypes.INTEGER, allowNull: false }
},
{
  tableName: 'rooms',
  timestamps: true,
  paranoid: true, // Kích hoạt quyền năng Xóa Mềm (Soft Delete)
});

module.exports = Room;