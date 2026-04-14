const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contractId: { type: DataTypes.INTEGER, allowNull: false },
  roomId: { type: DataTypes.INTEGER, allowNull: false }, // Lưu lại để lọc theo phòng
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, defaultValue: 5 },
  comment: { type: DataTypes.TEXT },
  images: { type: DataTypes.TEXT }, // Lưu JSON mảng [ "anh1.jpg", "anh2.jpg" ]
  videos: { type: DataTypes.TEXT }, // Lưu JSON mảng [ "video1.mp4" ]
  isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  // Phần dành cho Chủ nhà phản hồi
  landlordReply: { type: DataTypes.TEXT },
  replyDate: { type: DataTypes.DATE },
}, {
  tableName: 'reviews',
  timestamps: true
});

module.exports = Review;