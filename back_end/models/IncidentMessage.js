const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IncidentMessage = sequelize.define('IncidentMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  incidentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderRole: {
    type: DataTypes.ENUM('TENANT', 'LANDLORD'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'incident_messages',
  timestamps: true
});

module.exports = IncidentMessage;
