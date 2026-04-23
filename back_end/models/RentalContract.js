
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Đường dẫn file config DB của bạn

const RentalContract = sequelize.define('RentalContract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tenantEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // --- 1. THÔNG TIN CHỦ NHÀ (BÊN A) ---
  landlordName: { type: DataTypes.STRING },
  landlordDob: { type: DataTypes.DATEONLY }, // Chỉ lưu ngày tháng năm
  landlordPhone: { type: DataTypes.STRING },
  landlordIdentityNumber: { type: DataTypes.STRING },
  landlordHometown: { type: DataTypes.STRING },

  // --- 2. THÔNG TIN ĐẠI DIỆN THUÊ (BÊN B) ---
  tenantName: { type: DataTypes.STRING },
  tenantDob: { type: DataTypes.DATEONLY },
  tenantPhone: { type: DataTypes.STRING },
  tenantIdentityNumber: { type: DataTypes.STRING },
  tenantHometown: { type: DataTypes.STRING },

  // --- 3. THỜI HẠN & TRẠNG THÁI ---
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  contractImage: { type: DataTypes.JSON, allowNull: true, defaultValue: []},
  // --- THÊM 3 CỘT NÀY CHO TÍNH NĂNG BÁO TRẢ PHÒNG ---
  intendedMoveOutDate: { 
    type: DataTypes.DATEONLY, // Chỉ lưu ngày tháng năm dự kiến dọn đi
    allowNull: true 
  },
  noticeGivenBy: { 
    type: DataTypes.ENUM('LANDLORD', 'TENANT'), // Lưu lại ai là người "đòi" kết thúc
    allowNull: true 
  },
  terminationReason: { 
    type: DataTypes.STRING, // Lý do: "Chuyển công tác", "Lấy lại phòng cho con học"...
    allowNull: true 
  },
  // ------------------------------------------------
  status: { 
    type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'TERMINATED'), 
    defaultValue: 'ACTIVE' 
  },

  // --- 4. GIÁ CẢ ĐÀM PHÁN (Dùng để tính hóa đơn) ---
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  electricityPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  waterPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  internetPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  parkingPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  servicePrice: { type: DataTypes.FLOAT, defaultValue: 0 },

  // --- MỚI: Cờ đánh dấu khách tự thanh toán cho điện lực (Không chốt qua app) ---
  isDirectUtilityPayment: { type: DataTypes.BOOLEAN, defaultValue: false },

  startElectricity: { type: DataTypes.INTEGER, defaultValue: 0 },
  currentElectricity: { type: DataTypes.INTEGER, defaultValue: 0 }, // Lưu số mới nhất
  startWater: { type: DataTypes.INTEGER, defaultValue: 0 },
  currentWater: { type: DataTypes.INTEGER, defaultValue: 0 }, // Lưu số mới nhất
  vehicleCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  // --- 5. THÀNH VIÊN Ở CÙNG ---
  members: { 
    type: DataTypes.JSON, // Lưu mảng các Object thành viên dưới dạng JSON
    defaultValue: []
  },

  // --- 6. THÔNG TIN ĐĂNG KÝ TẠM TRÚ TẠM VẮNG ---
  residenceStatus: {
    type: DataTypes.ENUM('UNREGISTERED', 'REGISTERED'),
    defaultValue: 'UNREGISTERED' // Mặc định là chưa đăng ký
  },
  residenceDate: { type: DataTypes.DATEONLY }, // Ngày đi đăng ký
  residencePlace: { type: DataTypes.STRING },  // Nơi đăng ký (Công an phường...)
  residenceImage: { type: DataTypes.JSON },   // Ảnh giấy chứng nhận / sổ tạm trú
    // CỘT TÌNH TRẠNG PHÒNG BÀN GIAO
  conditionDescription: { type: DataTypes.TEXT, allowNull: true }, // Text mô tả
  conditionImages: { type: DataTypes.TEXT, allowNull: true },      // Mảng ảnh (JSON)
  conditionVideos: { type: DataTypes.TEXT, allowNull: true },      // Mảng video (JSON)
},

{
  tableName: 'rental_contracts',
  timestamps: true // Tự động tạo createdAt, updatedAt
});

module.exports = RentalContract;