const express = require('express');
const cors = require('cors');
const path = require('path'); // Đảm bảo có dòng này ở đầu file server.js
const http = require('http'); // Module HTTP để tạo Server cho Socket.io
const socketManager = require('./socketManager'); // Module quản lý Socket.io

// Cho phép Frontend truy cập trực tiếp vào các file trong thư mục 'uploads'



const app = express();
const startCronJobs = require('./cronJobs');

// ===== TẠO HTTP SERVER BỌC NGOÀI EXPRESS =====
const server = http.createServer(app);

// ===== KHỞI TẠO SOCKET.IO =====
socketManager.init(server);



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

// --- WALLET & SUBSCRIPTION ROUTES ---
const walletRoutes = require('./routes/walletRoutes');
app.use('/api/wallet', walletRoutes);

const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);
// --------------------

// --- THÊM 2 DÒNG NÀY VÀO ---
const serviceBillRoutes = require('./routes/serviceBillRoutes');
app.use('/api/bills', serviceBillRoutes);
// ----------------------------
const statisticRoutes = require('./routes/statisticRoutes');
app.use('/api/statistics', statisticRoutes);
require('./cron/billReminder'); // Khởi động Robot nhắc nhở hàng ngày

// ===== KHỞI ĐỘNG SERVER (CHỈ MỘT LẦN DUY NHẤT) =====
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => {
    console.log('Kết nối đến PostgreSQL thành công!');
    // Lệnh sync() sẽ tự động tạo các bảng dựa trên models bạn đã viết
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log('Đã đồng bộ hóa tất cả các bảng dữ liệu!');
    
    startCronJobs(); // Đánh thức robot chạy ngầm

    // THAY ĐỔI QUAN TRỌNG: Dùng server.listen() thay vì app.listen()
    // để Socket.io có thể hoạt động trên cùng cổng
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server & Socket.io đang chạy tại cổng ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Không thể kết nối tới cơ sở dữ liệu:', error);
  });