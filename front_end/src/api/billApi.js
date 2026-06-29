import axiosClient from './axiosClient';

const billApi = {
  createBill: (data) => {
    return axiosClient.post('/bills', data);
  },
  getAllBills: () => {
    return axiosClient.get('/bills');
  },
  payBill: (id) => {
    return axiosClient.put(`/bills/${id}/pay`);
  },
  rejectProof: (id, data) => {
    return axiosClient.put(`/bills/${id}/reject-proof`, data);
  },
  updateBill: (id, data) => {
    return axiosClient.put(`/bills/${id}`, data);
  },
  deleteBill: (id) => {
    return axiosClient.delete(`/bills/${id}`);
  }
};

export default billApi;
