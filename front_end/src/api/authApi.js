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
  },

  // Quên mật khẩu
  forgotPassword: (data) => {
    const url = '/auth/forgot-password';
    return axiosClient.post(url, data);
  },

  // Đặt lại mật khẩu
  resetPassword: (token, data) => {
    const url = `/auth/reset-password/${token}`;
    return axiosClient.post(url, data);
  },

  // Thay đổi mật khẩu
  changePassword: (data) => {
    const url = '/auth/change-password';
    return axiosClient.put(url, data);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: (data) => {
    const url = '/auth/profile';
    return axiosClient.put(url, data);
  }
};

export default authApi;