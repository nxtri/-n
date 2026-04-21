import axiosClient from './axiosClient';

const adminApi = {
  // Lấy tất cả người dùng
  getAllUsers: () => {
    return axiosClient.get('/admin/users');
  },

  // Khóa / Mở khóa tài khoản
  toggleUserStatus: (id) => {
    return axiosClient.put(`/admin/users/${id}/toggle-status`);
  },

  // Xóa tài khoản
  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  // Lấy chi tiết user
  getUserDetail: (id) => {
    return axiosClient.get(`/admin/users/${id}`);
  },

  // Gửi thông báo hàng loạt
  broadcastNotification: (data) => {
    return axiosClient.post('/admin/notifications/broadcast', data);
  },

  // ==========================
  // PHASE 3 & 4
  // ==========================
  getAllRooms: () => {
    return axiosClient.get('/admin/rooms');
  },
  toggleRoomVisibility: (id) => {
    return axiosClient.put(`/admin/rooms/${id}/toggle-visibility`);
  },
  getAllContracts: () => {
    return axiosClient.get('/admin/contracts');
  },
  getAllIncidents: () => {
    return axiosClient.get('/admin/incidents');
  },
  getDashboardStats: (params) => {
    return axiosClient.get('/admin/stats', { params });
  },
  getRegulations: () => {
    return axiosClient.get('/admin/regulations');
  },
  updateRegulation: (data) => {
    return axiosClient.put('/admin/regulations', data);
  },
  deleteRegulation: (id) => {
    return axiosClient.delete(`/admin/regulations/${id}`);
  },
  getRoomReviews: (roomId) => {
    return axiosClient.get(`/admin/rooms/${roomId}/reviews`);
  },
  deleteReview: (reviewId) => {
    return axiosClient.delete(`/admin/reviews/${reviewId}`);
  },
  updateReportStatus: (reportId, status) => {
    return axiosClient.put(`/admin/reports/${reportId}/status`, { status });
  },
  resolveAllRoomReports: (roomId) => {
    return axiosClient.put(`/admin/rooms/${roomId}/resolve-reports`);
  }
};

export default adminApi;
