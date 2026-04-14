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
  }
};

export default billApi;