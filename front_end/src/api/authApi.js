import axiosClient from './axiosClient';

const authApi = {
  // Hàm gọi API Đăng ký
  register: (data) => {
    const url = '/auth/register';
    return axiosClient.post(url, data);
  },

  // Hàm gọi API Đăng nhập
  login: (data) => {
    const url = '/auth/login';
    return axiosClient.post(url, data);
  }
};

export default authApi;