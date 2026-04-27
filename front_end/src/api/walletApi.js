import axiosClient from './axiosClient';

const walletApi = {
  // === CHỦ NHÀ (LANDLORD) ===
  
  // Nạp tiền (kèm ảnh minh chứng)
  createDeposit: (formData) => axiosClient.post('/wallet/deposit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Xem lịch sử giao dịch
  getMyTransactions: () => axiosClient.get('/wallet/transactions'),

  // Lấy thông tin ví (số dư, gói hiện tại)
  getMyWallet: () => axiosClient.get('/wallet/my-wallet'),

  // Lấy thông tin ngân hàng Admin (để hiện QR)
  getAdminBankInfo: () => axiosClient.get('/wallet/admin-bank-info'),

  // === GÓI ĐĂNG KÝ ===
  
  // Lấy danh sách gói dịch vụ
  getPlans: () => axiosClient.get('/subscriptions/plans'),

  // Mua gói dịch vụ
  buyPlan: (data) => axiosClient.post('/subscriptions/buy', data),

  // === ADMIN ===
  
  // Lấy tất cả giao dịch
  getAllTransactions: () => axiosClient.get('/wallet/admin/transactions'),

  // Duyệt nạp tiền
  approveDeposit: (id) => axiosClient.put(`/wallet/admin/approve/${id}`),

  // Từ chối nạp tiền
  rejectDeposit: (id) => axiosClient.put(`/wallet/admin/reject/${id}`),

  // Cập nhật thông tin ngân hàng Admin
  updateAdminBankInfo: (data) => axiosClient.put('/wallet/admin/bank-info', data),

  // Lấy thông tin ngân hàng (dùng cho Admin dashboard)
  getAdminBankInfoForAdmin: () => axiosClient.get('/wallet/admin/bank-info'),

  // Cập nhật cấu hình gói dịch vụ
  updatePlanConfig: (data) => axiosClient.put('/subscriptions/admin/config', data),
};

export default walletApi;
