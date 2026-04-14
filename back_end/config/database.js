const { Sequelize } = require('sequelize');

// Khởi tạo kết nối đến CSDL PostgreSQL
const sequelize = new Sequelize('phongtro_db', 'postgres', '270307', {
  host: 'localhost',   // Máy chủ chứa CSDL (chạy trên máy bạn là localhost)
  dialect: 'postgres', // Khai báo loại CSDL hệ thống đang dùng
  logging: false,      // Tắt log các câu lệnh SQL trên terminal cho đỡ rối
});

module.exports = sequelize;