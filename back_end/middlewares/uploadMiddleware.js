const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu file và tên file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Lưu vào thư mục uploads
  },
  filename: function (req, file, cb) {
    // Đặt tên file kèm theo thời gian và chuỗi ngẫu nhiên để không bị trùng tên khi upload nhiều file cùng lúc
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });
module.exports = upload;