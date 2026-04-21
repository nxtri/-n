const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: true // Nếu người dùng không đăng nhập thì để null
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RESOLVED', 'REJECTED'),
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;
