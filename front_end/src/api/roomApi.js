import axiosClient from './axiosClient';

const roomApi = {
  getAllRooms: (params) => axiosClient.get('/rooms', { params }),
  getPublicRooms: () => axiosClient.get('/rooms/public'),
  // Cập nhật ghi chú giữ chỗ
  updateDeposit: (id, note) => axiosClient.put(`/rooms/${id}/deposit`, { note }),
  getRoomById: (id) => axiosClient.get(`/rooms/${id}`),
  
  // BẮT BUỘC THÊM HEADER NÀY ĐỂ BÁO CHO BACKEND BIẾT LÀ ĐANG GỬI FILE
  createRoom: (data) => axiosClient.post('/rooms', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  updateStatus: (id, status) => axiosClient.put(`/rooms/${id}/status`, { status }),
  updateRoom: (id, data) => axiosClient.put(`/rooms/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteRoom: (id) => axiosClient.delete(`/rooms/${id}`),
};

export default roomApi;