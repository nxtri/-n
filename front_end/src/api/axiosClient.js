import axios from 'axios';

// Tạo một bản sao của axios với cấu hình mặc định
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Trỏ đến địa chỉ Backend của chúng ta
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chặn các request gửi đi để nhét Token vào
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage của trình duyệt
    const token = localStorage.getItem('token');
    
    // Nếu có token, thêm dòng 'Authorization: Bearer <token>' vào Header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Chặn các response trả về để xử lý dữ liệu gọn gàng hơn
axiosClient.interceptors.response.use(
  (response) => {
    // Chỉ lấy phần data chứa thông tin thật sự, bỏ qua các thông tin rườm rà của HTTP
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi tập trung ở đây (ví dụ: Token hết hạn thì bắt đăng nhập lại)
    throw error;
  }
);

export default axiosClient;