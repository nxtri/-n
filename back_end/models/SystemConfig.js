const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  target: {
    type: DataTypes.ENUM('ALL', 'TENANT', 'LANDLORD'),
    defaultValue: 'ALL'
  }
}, {
  tableName: 'system_configs',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['key', 'target']
    }
  ]
});

module.exports = SystemConfig;
