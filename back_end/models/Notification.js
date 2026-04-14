const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,     
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER, // ID của người nhận thông báo (Chủ nhà hoặc Khách)
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true // Tự động có createdAt để biết thời gian thông báo
});

module.exports = Notification;