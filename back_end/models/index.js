const sequelize = require('../config/database');

// Import các file Model mà chúng ta đã tạo
const User = require('./User');
const Room = require('./Room');
const RentalContract = require('./RentalContract');
const ServiceBill = require('./ServiceBill');
const Notification = require('./Notification');
const Review = require('./Review');
const Incident = require('./Incident');
const IncidentMessage = require('./IncidentMessage');
// ---------------------------------------------------
// THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS)
// ---------------------------------------------------

// 1. Chủ nhà (User) và Phòng (Room) - Quan hệ 1:N
// Một chủ nhà có thể có nhiều phòng, nhưng một phòng chỉ thuộc về một chủ nhà
User.hasMany(Room, { foreignKey: 'landlordId', as: 'rooms' });
Room.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });

// 2. Người thuê (User) và Hợp đồng (RentalContract) - Quan hệ 1:N
// Một người thuê có thể ký nhiều hợp đồng (thuê nhiều phòng)
User.hasMany(RentalContract, { foreignKey: 'tenantId', as: 'contracts' });
RentalContract.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

// 3. Phòng (Room) và Hợp đồng (RentalContract) - Quan hệ 1:N
// Một phòng có thể có nhiều hợp đồng theo thời gian (người cũ đi, người mới đến)
Room.hasMany(RentalContract, { foreignKey: 'roomId', as: 'contracts' });
RentalContract.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

// 4. Hợp đồng (RentalContract) và Hóa đơn (ServiceBill) - Quan hệ 1:N
// Một hợp đồng sẽ sinh ra nhiều hóa đơn (mỗi tháng một hóa đơn)
RentalContract.hasMany(ServiceBill, { foreignKey: 'contractId', as: 'bills' });
ServiceBill.belongsTo(RentalContract, { foreignKey: 'contractId', as: 'contract' });

// 5. Đánh giá (Review) relations
Review.belongsTo(RentalContract, { foreignKey: 'contractId', as: 'contract' });
RentalContract.hasMany(Review, { foreignKey: 'contractId', as: 'reviews' });

Review.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Room.hasMany(Review, { foreignKey: 'roomId', as: 'reviews' });

Review.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
User.hasMany(Review, { foreignKey: 'tenantId', as: 'reviews' });

// 6. Sự cố (Incident) relations
Incident.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
User.hasMany(Incident, { foreignKey: 'tenantId', as: 'reportedIncidents' });

Incident.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });
User.hasMany(Incident, { foreignKey: 'landlordId', as: 'receivedIncidents' });

Incident.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Room.hasMany(Incident, { foreignKey: 'roomId', as: 'incidents' });

// 7. Tin nhắn sự cố (IncidentMessage) relations
IncidentMessage.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });
Incident.hasMany(IncidentMessage, { foreignKey: 'incidentId', as: 'messages' });

IncidentMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(IncidentMessage, { foreignKey: 'senderId', as: 'sentMessages' });

// Xuất các model ra để sử dụng ở các phần khác của dự án
module.exports = {
  sequelize,
  User,
  Room,
  RentalContract,
  ServiceBill,
  Notification,
  Review,
  Incident,
  IncidentMessage
};