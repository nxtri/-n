import React, { useState, useEffect } from 'react';
import walletApi from '../../api/walletApi';

const AdminSubscriptionTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState(null);
  const [bankInfo, setBankInfo] = useState({ bankId: '', bankAccount: '', bankName: '' });
  const [activeSection, setActiveSection] = useState('deposits');
  const [editPlans, setEditPlans] = useState(null);
  const [proofModal, setProofModal] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      // Sử dụng Promise.allSettled để đảm bảo nếu 1 API lỗi thì các cái khác vẫn chạy
      const results = await Promise.allSettled([
        walletApi.getAllTransactions(), 
        walletApi.getPlans(), 
        walletApi.getAdminBankInfoForAdmin()
      ]);

      if (results[0].status === 'fulfilled') {
        setTransactions(results[0].value.transactions || []);
      } else {
        console.error('Lỗi lấy transactions:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setPlans(results[1].value.plans);
        setEditPlans(JSON.parse(JSON.stringify(results[1].value.plans)));
      } else {
        console.error('Lỗi lấy plans:', results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        setBankInfo(results[2].value.bankInfo || { bankId: '', bankAccount: '', bankName: '' });
      } else {
        console.error('Lỗi lấy bank info:', results[2].reason);
      }
    } catch (e) { 
      console.error('Lỗi fetchAll:', e); 
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận DUYỆT nạp tiền?')) return;
    try { await walletApi.approveDeposit(id); alert('Đã duyệt!'); fetchAll(); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi!'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Xác nhận TỪ CHỐI nạp tiền?')) return;
    try { await walletApi.rejectDeposit(id); alert('Đã từ chối!'); fetchAll(); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi!'); }
  };

  const handleSaveBankInfo = async () => {
    try { await walletApi.updateAdminBankInfo(bankInfo); alert('Cập nhật thành công!'); }
    catch (e) { alert('Lỗi!'); }
  };

  const handleSavePlanConfig = async () => {
    try {
      const planConfigs = {};
      Object.entries(editPlans).forEach(([key, val]) => {
        planConfigs[key] = { price: val.price, limit: val.limit };
      });
      await walletApi.updatePlanConfig({ planConfigs });
      alert('Cập nhật cấu hình gói thành công!');
      fetchAll();
    } catch (e) { alert('Lỗi!'); }
  };

  const pendingCount = transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">payments</span>
          Quản lý Thu phí & Gói Dịch Vụ
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          {id:'deposits',icon:'receipt_long',label:'Duyệt nạp tiền', badge: pendingCount},
          {id:'planConfig',icon:'tune',label:'Cấu hình Gói'},
          {id:'bankConfig',icon:'account_balance',label:'Ngân hàng nhận tiền'},
          {id:'allHistory',icon:'history',label:'Toàn bộ giao dịch'}
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveSection(t.id)} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeSection===t.id?'bg-primary text-on-primary shadow-lg':'bg-white border border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
            <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
            {t.badge > 0 && <span className="bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-full">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* DUYỆT NẠP TIỀN */}
      {activeSection === 'deposits' && (
        <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="text-lg font-black text-on-surface">Yêu cầu nạp tiền chờ duyệt</h3>
            <span className="bg-error/10 text-error text-xs font-black px-3 py-1 rounded-full">{pendingCount} đang chờ</span>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {transactions.filter(t=>t.type==='DEPOSIT').length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-bold">Chưa có yêu cầu nạp tiền nào</div>
            ) : transactions.filter(t=>t.type==='DEPOSIT').map(tx => (
              <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-surface-container-low/50 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">savings</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{tx.user?.fullName || 'N/A'} <span className="text-on-surface-variant font-normal">({tx.user?.email})</span></p>
                    <p className="text-xs text-on-surface-variant">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <p className="text-lg font-black text-green-600 mx-4">+{tx.amount.toLocaleString('vi-VN')} đ</p>
                  {tx.proofImage && (
                    <button onClick={()=>setProofModal(tx.proofImage)} className="text-primary hover:underline text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">image</span>Xem ảnh
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {tx.status === 'PENDING' ? (
                    <>
                      <button onClick={()=>handleApprove(tx.id)} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check</span>Duyệt
                      </button>
                      <button onClick={()=>handleReject(tx.id)} className="px-4 py-2 bg-error/10 text-error rounded-xl font-bold text-sm hover:bg-error hover:text-white transition-all flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">close</span>Từ chối
                      </button>
                    </>
                  ) : (
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${tx.status==='APPROVED'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{tx.status==='APPROVED'?'Đã duyệt':'Từ chối'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CẤU HÌNH GÓI */}
      {activeSection === 'planConfig' && editPlans && (
        <div className="bg-white rounded-3xl border border-outline-variant/20 p-8 space-y-6">
          <h3 className="text-lg font-black text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">tune</span>Cấu hình giá & giới hạn phòng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(editPlans).map(([key, plan]) => (
              <div key={key} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-4">
                <h4 className="font-black text-on-surface text-lg">{key === 'BRONZE' ? '🥉 Đồng' : key === 'SILVER' ? '🥈 Bạc' : key === 'GOLD' ? '🥇 Vàng' : '💎 Kim Cương'}</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant">Giá / tháng (VNĐ)</label>
                  <input type="number" value={plan.price} onChange={e => setEditPlans({...editPlans, [key]: {...plan, price: parseInt(e.target.value)||0}})} className="w-full p-3 border border-outline-variant/30 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"/>
                </div>
                {key !== 'DIAMOND' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant">Giới hạn số phòng</label>
                    <input type="number" value={plan.limit} onChange={e => setEditPlans({...editPlans, [key]: {...plan, limit: parseInt(e.target.value)||0}})} className="w-full p-3 border border-outline-variant/30 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"/>
                  </div>
                )}
                {key === 'DIAMOND' && <p className="text-xs font-bold text-on-surface-variant italic">Không giới hạn số phòng</p>}
              </div>
            ))}
          </div>
          <button onClick={handleSavePlanConfig} className="bg-primary text-on-primary px-8 py-3 rounded-xl font-black shadow-lg hover:opacity-90 transition-all">Lưu cấu hình</button>
        </div>
      )}

      {/* CẤU HÌNH NGÂN HÀNG */}
      {activeSection === 'bankConfig' && (
        <div className="bg-white rounded-3xl border border-outline-variant/20 p-8 space-y-6 max-w-xl">
          <h3 className="text-lg font-black text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">account_balance</span>Thông tin ngân hàng nhận tiền</h3>
          <p className="text-sm text-on-surface-variant">Thông tin này sẽ hiển thị trên mã QR để chủ nhà chuyển khoản nạp tiền.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tên ngân hàng</label>
              <select 
                value={bankInfo.bankId} 
                onChange={e => setBankInfo({...bankInfo, bankId: e.target.value})} 
                className="w-full p-3 border border-outline-variant/30 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {['MB', 'VCB', 'TCB', 'ACB', 'BIDV', 'VPB', 'ICB', 'VBA', 'STB', 'SHB', 'TPB', 'HDB', 'VIB'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số tài khoản</label>
              <input type="text" value={bankInfo.bankAccount} onChange={e => setBankInfo({...bankInfo, bankAccount: e.target.value})} placeholder="VD: 1234567890" className="w-full p-3 border border-outline-variant/30 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"/>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tên chủ tài khoản</label>
              <input type="text" value={bankInfo.bankName} onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} placeholder="VD: NGUYEN VAN A" className="w-full p-3 border border-outline-variant/30 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"/>
            </div>
          </div>
          {bankInfo.bankId && bankInfo.bankAccount && (
            <div className="text-center p-4 bg-surface-container-low rounded-2xl">
              <p className="text-xs font-bold text-on-surface-variant mb-3">Xem trước QR</p>
              <img src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.bankAccount}-compact.png?amount=100000&addInfo=PREVIEW&accountName=${encodeURIComponent(bankInfo.bankName)}`} alt="Preview QR" className="w-48 mx-auto rounded-xl border-2 border-white shadow-lg"/>
            </div>
          )}
          <button onClick={handleSaveBankInfo} className="bg-primary text-on-primary px-8 py-3 rounded-xl font-black shadow-lg hover:opacity-90 transition-all">Lưu thông tin ngân hàng</button>
        </div>
      )}

      {/* TOÀN BỘ GIAO DỊCH */}
      {activeSection === 'allHistory' && (
        <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10"><h3 className="text-lg font-black text-on-surface">Toàn bộ giao dịch</h3></div>
          <div className="divide-y divide-outline-variant/10">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-bold">Chưa có giao dịch</div>
            ) : transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type==='DEPOSIT'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined">{tx.type==='DEPOSIT'?'savings':'workspace_premium'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.user?.fullName} - {tx.description}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.amount>0?'text-green-600':'text-error'}`}>{tx.amount>0?'+':''}{tx.amount.toLocaleString('vi-VN')} đ</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${tx.status==='APPROVED'||tx.status==='COMPLETED'?'bg-green-100 text-green-700':tx.status==='PENDING'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH MINH CHỨNG */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[9999]" onClick={()=>setProofModal(null)}>
          <button onClick={()=>setProofModal(null)} className="absolute top-5 right-5 text-white text-3xl">✖</button>
          <img src={`http://localhost:5000/uploads/${proofModal}`} alt="Proof" className="max-w-[90%] max-h-[90%] object-contain rounded-2xl shadow-2xl"/>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionTab;
