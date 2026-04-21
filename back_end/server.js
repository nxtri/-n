const express = require('express');
const cors = require('cors');
const path = require('path'); // Đảm bảo có dòng này ở đầu file server.js

// Cho phép Frontend truy cập trực tiếp vào các file trong thư mục 'uploads'



const app = express();
const startCronJobs = require('./cronJobs');





app.use(express.json());
app.use(cors());app.use('/uploads', express.static('uploads'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const billRoutes = require('./routes/billRoutes'); // Khai báo
app.use('/api/bills', billRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // Tiền tố cho các API xác thực


const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes); 


// --- THÊM 2 DÒNG NÀY VÀO ---
const contractRoutes = require('./routes/contractRoutes');
app.use('/api/contracts', contractRoutes);

const incidentRoutes = require('./routes/incidentRoutes');
app.use('/api/incidents', incidentRoutes);

// --- ADMIN ROUTES ---
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);
// --------------------

const { sequelize } = require('./models');
sequelize.sync()
  .then(() => {
    console.log("Database & tables created!");
    
    startCronJobs(); // <--- 2. ĐÁNH THỨC ROBOT CHẠY NGẦM Ở ĐÂY

    app.listen(5000, () => {
      console.log('Server is running on port 5000');
    });
  })


// --- THÊM 2 DÒNG NÀY VÀO ---
const serviceBillRoutes = require('./routes/serviceBillRoutes');
app.use('/api/bills', serviceBillRoutes);
// ----------------------------
const statisticRoutes = require('./routes/statisticRoutes');
app.use('/api/statistics', statisticRoutes);
require('./cron/billReminder'); // Khởi động Robot nhắc nhở hàng ngày

// Kiểm tra kết nối và đồng bộ hóa (tự động tạo bảng)
sequelize.authenticate()
  .then(() => {
    console.log('Kết nối đến PostgreSQL thành công!');
    // Lệnh sync() sẽ tự động tạo các bảng dựa trên models bạn đã viết
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log('Đã đồng bộ hóa tất cả các bảng dữ liệu!');
    
    // Khởi động server lắng nghe ở cổng 5000
    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Không thể kết nối tới cơ sở dữ liệu:', error);
  });