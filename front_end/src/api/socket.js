import { io } from 'socket.io-client';

/**
 * Khởi tạo Socket.io client - kết nối tới Backend.
 * autoConnect: false => Chỉ kết nối khi user đã đăng nhập (gọi socket.connect() thủ công).
 */
const socket = io('http://localhost:5000', {
  autoConnect: false,
});

export default socket;
