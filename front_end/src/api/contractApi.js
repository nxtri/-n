import axiosClient from './axiosClient';

const contractApi = {
  createContract: (formData) => {
    return axiosClient.post('/contracts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 👈 DÒNG QUAN TRỌNG NHẤT
      },
    });
  },

  updateContractServices: (contractId, data) => {
    // data có dạng { vehicleCount: 2, servicePrice: 150000 }
    return axiosClient.put(`/contracts/${contractId}/services`, data);
  },
  requestTermination: (contractId, data) => {
    return axiosClient.post(`/contracts/${contractId}/notice-terminate`, data);
  },
  getMyContract: () => {
    return axiosClient.get('/contracts/my-contract');
  },
  // Hủy yêu cầu trả phòng
  cancelTermination: (id) => axiosClient.put(`/contracts/${id}/cancel-terminate`),

  updateContract: (id, data) => {
    return axiosClient.put(`/contracts/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Các API cũ của bạn...
  submitReview: (id, data) => axiosClient.post(`/contracts/${id}/review`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReviews: () => axiosClient.get('/contracts/my-reviews'),
  
  // 🚨 THÊM DÒNG NÀY VÀO ĐỂ GỌI API PHẢN HỒI:
  replyReview: (reviewId, data) => axiosClient.put(`/contracts/review/${reviewId}/reply`, data),

  // 2. Nộp ảnh minh chứng tạm trú (Gửi file nên cần multipart/form-data)
  updateResidenceProof: (contractId, formData) => {
    return axiosClient.put(`/contracts/my-contract/${contractId}/residence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAllContracts: () => {
    return axiosClient.get('/contracts');
  },
  endContract: (id) => axiosClient.put(`/contracts/${id}/end`)

};


export default contractApi;