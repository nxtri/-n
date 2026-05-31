const { Server } = require('socket.io');
const { isAllowedOrigin } = require('./config/corsOptions');

let io = null;
const onlineUsers = new Map(); // userId -> socketId

module.exports = {
  /**
   * Khởi tạo Socket.io server, gắn vào HTTP Server đã có.
   * Hàm này chỉ được gọi MỘT LẦN DUY NHẤT trong server.js.
   */
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            return callback(null, true);
          }

          return callback(new Error(`Origin ${origin} is not allowed by Socket.IO CORS`));
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Có người vừa kết nối: ${socket.id}`);

      // Khi Frontend đăng nhập xong, nó sẽ gửi ID của user lên đây
      socket.on('user_online', (userId) => {
        onlineUsers.set(String(userId), socket.id);
        console.log(`👤 User ${userId} đang online với socket ${socket.id}`);
      });

      // Khi người dùng tắt trình duyệt hoặc thoát trang
      socket.on('disconnect', () => {
        for (let [key, value] of onlineUsers.entries()) {
          if (value === socket.id) {
            onlineUsers.delete(key);
            break;
          }
        }
        console.log(`🔴 Mất kết nối: ${socket.id}`);
      });
    });

    console.log('✅ Socket.io đã được khởi tạo thành công!');
    return io;
  },

  /**
   * Lấy instance Socket.io (dùng trong notificationHelper, controllers,...)
   */
  getIO: () => io,

  /**
   * Lấy danh sách user đang online (Map: userId -> socketId)
   */
  getOnlineUsers: () => onlineUsers,

  emitToUser: (userId, event, payload = {}) => {
    if (!io) return false;
    const socketId = onlineUsers.get(String(userId));
    if (!socketId) return false;

    io.to(socketId).emit(event, payload);
    return true;
  },

  emitToUsers: (userIds = [], event, payload = {}) => {
    if (!io) return 0;

    let sentCount = 0;
    userIds.forEach((userId) => {
      const socketId = onlineUsers.get(String(userId));
      if (socketId) {
        io.to(socketId).emit(event, payload);
        sentCount += 1;
      }
    });

    return sentCount;
  },
};
