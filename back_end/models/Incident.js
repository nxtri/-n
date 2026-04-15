const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  landlordId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.TEXT, // Lữu trữ dạng mảng chuỗi JSON ["img1.png", "img2.png"]
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('images', value ? JSON.stringify(value) : null);
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Resolved', 'Rejected'),
    defaultValue: 'Pending',
    allowNull: false
  },
  landlordReply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  repairDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  repairCost: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'incidents',
  timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = Incident;
