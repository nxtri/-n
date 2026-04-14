import axiosClient from './axiosClient';

const notificationApi = {
  getMyNotifications: () => {
    return axiosClient.get('/notifications');
  },
  markAsRead: (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
  }
};

export default notificationApi;