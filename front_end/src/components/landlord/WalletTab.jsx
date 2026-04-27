import React, { useState, useEffect } from 'react';
import walletApi from '../../api/walletApi';

const PLAN_INFO = {
  BRONZE:  { name: 'Đồng', icon: '🥉', color: '#cd7f32', bg: 'from-amber-800/10 to-amber-900/5', border: 'border-amber-700/30', rank: 1 },
  SILVER:  { name: 'Bạc', icon: '🥈', color: '#86efac', bg: 'from-green-400/10 to-emerald-500/5', border: 'border-green-300/50', rank: 2 },
  GOLD:    { name: 'Vàng', icon: '🥇', color: '#2dd4bf', bg: 'from-teal-400/10 to-cyan-500/5', border: 'border-teal-400/50', rank: 3 },
  DIAMOND: { name: 'Kim Cương', icon: '💎', color: '#facc15', bg: 'from-yellow-300/10 to-amber-400/5', border: 'border-yellow-400/50', rank: 4 },
};

const WalletTab = () => {
  const [wallet, setWallet] = useState(null);
  const [plans, setPlans] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [activeSection, setActiveSection] = useState('plans'); // plans | deposit | history

  // State nạp tiền
  const [depositAmount, setDepositAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // State mua gói
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [months, setMonths] = useState(1);
  const [extraRooms, setExtraRooms] = useState(1);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [buyMode, setBuyMode] = useState('BASE'); // 'BASE' | 'RETAIL'

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [w, p, t, b] = await Promise.all([
        walletApi.getMyWallet(), walletApi.getPlans(), walletApi.getMyTransactions(), walletApi.getAdminBankInfo()
      ]);
      setWallet(w.wallet); setPlans(p.plans); setTransactions(t.transactions || []); setBankInfo(b.bankInfo);
    } catch (e) { console.error(e); }
  };

  const handleDeposit = async () => {
    if (!proofFile) return alert('Vui lòng tải lên ảnh minh chứng!');
    if (!depositAmount || depositAmount <= 0) return alert('Số tiền không hợp lệ!');
    const fd = new FormData();
    fd.append('amount', depositAmount);
    fd.append('proofImage', proofFile);
    try {
      const res = await walletApi.createDeposit(fd);
      alert(res.message);
      setDepositAmount(''); setProofFile(null); setShowQR(false);
      fetchAll();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi!'); }
  };

  const handleBuyPlan = async () => {
    if (!selectedPlan) return;
    try {
      let actionType = 'BUY_BASE';
      if (buyMode === 'RETAIL') {
        actionType = (wallet?.subscriptionPlan === 'NONE' || isExpired) ? 'BUY_RETAIL_NEW' : 'BUY_RETAIL_ADD';
      }

      const res = await walletApi.buyPlan({ 
        plan: selectedPlan, 
        months: Number(months), 
        extraRooms: Number(extraRooms),
        actionType 
      });
      alert(res.message);
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && res.user) {
        user.subscriptionPlan = res.user.subscriptionPlan;
        user.subscriptionExpiry = res.user.subscriptionExpiry;
        user.balance = res.user.balance;
        localStorage.setItem('user', JSON.stringify(user));
      }
      setShowBuyConfirm(false); setSelectedPlan(null); setMonths(1); setExtraRooms(1);
      fetchAll();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi!'); }
  };

  const isExpired = wallet?.subscriptionExpiry ? new Date(wallet.subscriptionExpiry) < new Date() : true;
  const currentPlanInfo = wallet?.subscriptionPlan && wallet.subscriptionPlan !== 'NONE' ? PLAN_INFO[wallet.subscriptionPlan] : null;

  // Tính toán bù trừ nâng cấp
  const calculateUpgradeCost = () => {
    if (!selectedPlan || !plans || buyMode === 'RETAIL') return { total: 0, remainingValue: 0 };
    const newPlanPrice = plans[selectedPlan].price;
    const newCost = newPlanPrice * months;
    
    let remainingValue = 0;
    if (wallet?.hasBasePlan && currentPlanInfo && !isExpired) {
      const oldPlanPrice = plans[wallet.subscriptionPlan]?.price || 0;
      const daysLeft = Math.ceil((new Date(wallet.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24));
      remainingValue = (oldPlanPrice / 30) * daysLeft;
    }
    
    let total = newCost - remainingValue;
    return { total: Math.round(total), remainingValue: Math.round(remainingValue) };
  };

  // Tính toán mua lẻ
  const calculateRetailCost = () => {
    if (!selectedPlan || !plans || buyMode !== 'RETAIL') return { total: 0, daysLeft: 0 };
    const retailPrice = plans[selectedPlan].retailPrice;
    
    if (wallet?.subscriptionPlan === 'NONE' || isExpired) {
      return { total: retailPrice * extraRooms * months, daysLeft: months * 30 };
    } else {
      const daysLeft = Math.ceil((new Date(wallet.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24));
      const total = (retailPrice / 30) * daysLeft * extraRooms;
      return { total: Math.round(total), daysLeft };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* WALLET OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-3xl border border-primary/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Số dư ví</p>
          <p className="text-3xl font-black text-on-surface">{(wallet?.balance || 0).toLocaleString('vi-VN')} <span className="text-lg">đ</span></p>
          <button onClick={() => setActiveSection('deposit')} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add_circle</span> Nạp tiền
          </button>
        </div>
        <div className={`p-6 rounded-3xl border ${currentPlanInfo && !isExpired ? currentPlanInfo.border + ' bg-gradient-to-br ' + currentPlanInfo.bg : 'border-outline-variant/30 bg-surface-container-low'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Gói hiện tại</p>
          {currentPlanInfo && !isExpired ? (
            <>
              <p className="text-2xl font-black text-on-surface flex items-center gap-2">
                {currentPlanInfo.icon} {currentPlanInfo.name} 
                {!wallet?.hasBasePlan && <span className="text-[10px] bg-white/50 text-black px-2 py-0.5 rounded-full border border-black/10">Gói lẻ</span>}
              </p>
              <p className="text-xs font-bold text-on-surface-variant mt-2">Hết hạn: {new Date(wallet.subscriptionExpiry).toLocaleDateString('vi-VN')}</p>
              {wallet?.extraRoomLimit > 0 && (
                <p className="text-xs font-bold text-primary mt-1">+ {wallet.extraRoomLimit} phòng lẻ mua thêm</p>
              )}
            </>
          ) : (
            <p className="text-xl font-black text-error">Chưa có gói / Hết hạn</p>
          )}
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Lịch sử</p>
          <p className="text-3xl font-black text-on-surface">{transactions.length}</p>
          <button onClick={() => setActiveSection('history')} className="mt-4 text-primary font-bold text-sm hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">history</span> Xem chi tiết
          </button>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex gap-2">
        {[{id:'plans',icon:'workspace_premium',label:'Mua gói'},{id:'deposit',icon:'account_balance_wallet',label:'Nạp tiền'},{id:'history',icon:'receipt_long',label:'Lịch sử'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveSection(t.id)} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeSection===t.id?'bg-primary text-on-primary shadow-lg shadow-primary/20':'bg-white border border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
            <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* MUA GÓI */}
      {activeSection === 'plans' && plans && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(plans).map(([key, plan]) => {
            const info = PLAN_INFO[key];
            const isCurrent = wallet?.subscriptionPlan === key && !isExpired;
            return (
              <div key={key} className={`relative p-6 rounded-3xl border-2 transition-all hover:scale-[1.02] flex flex-col ${isCurrent ? 'ring-2 ring-primary shadow-xl' : ''} ${selectedPlan === key ? 'border-primary bg-primary/5 shadow-lg' : `${info.border} bg-gradient-to-br ${info.bg}`}`}>
                {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Đang dùng</div>}
                {key === 'DIAMOND' && <div className="absolute -top-3 right-4 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">HOT</div>}
                <div className="text-center mb-4">
                  <span className="text-4xl">{info.icon}</span>
                  <h3 className="text-xl font-black text-on-surface mt-2">{info.name}</h3>
                </div>
                
                {/* Giá gói chính */}
                <div className="text-center mb-2">
                  <p className="text-2xl font-black text-primary">{plan.price.toLocaleString('vi-VN')} <span className="text-xs font-bold text-on-surface-variant">đ/tháng</span></p>
                  <p className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded mt-1 inline-block">Gói cơ bản ({plan.limit === -1 ? 'Không giới hạn' : plan.limit} phòng)</p>
                </div>
                
                {/* Giá gói lẻ */}
                <div className="text-center mt-2 pb-4 border-b border-outline-variant/20">
                  <p className="text-lg font-black text-secondary">{(plan.retailPrice || 0).toLocaleString('vi-VN')} <span className="text-xs font-bold text-on-surface-variant">đ/phòng/tháng</span></p>
                  <p className="text-[10px] font-bold text-on-surface-variant">Gói bán lẻ từng phòng</p>
                </div>

                <div className="space-y-2 mt-4 text-sm flex-1">
                  <div className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-lg text-primary">check_circle</span>Viền bài đăng {key === 'BRONZE' ? 'mặc định' : 'nổi bật'}</div>
                  {key === 'DIAMOND' && <div className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-lg text-yellow-500">star</span><b>Ưu tiên hiển thị đầu tiên</b></div>}
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button onClick={() => { setSelectedPlan(key); setBuyMode('BASE'); setShowBuyConfirm(true); }} className="flex-[2] py-2.5 rounded-xl font-bold text-xs transition-all bg-primary text-on-primary hover:opacity-90 shadow-md">
                    Mua gói chính
                  </button>
                  <button onClick={() => { setSelectedPlan(key); setBuyMode('RETAIL'); setShowBuyConfirm(true); }} className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all bg-secondary text-white hover:opacity-90 shadow-md">
                    Mua lẻ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL XÁC NHẬN MUA */}
      {showBuyConfirm && selectedPlan && plans && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black text-on-surface flex items-center gap-2">
              {PLAN_INFO[selectedPlan].icon} {buyMode === 'BASE' ? `Mua gói chính ${PLAN_INFO[selectedPlan].name}` : `Mua lẻ gói ${PLAN_INFO[selectedPlan].name}`}
            </h3>
            
            {buyMode === 'BASE' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Số tháng đăng ký</label>
                <input type="number" min="1" value={months} onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 border border-outline-variant/30 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none"/>
              </div>
            )}

            {buyMode === 'RETAIL' && (
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Số phòng lẻ</label>
                  <input type="number" min="1" value={extraRooms} onChange={(e) => setExtraRooms(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 border border-outline-variant/30 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none"/>
                </div>
                {(wallet?.subscriptionPlan === 'NONE' || isExpired) && (
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Số tháng</label>
                    <input type="number" min="1" value={months} onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 border border-outline-variant/30 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none"/>
                  </div>
                )}
              </div>
            )}

            {/* HIỂN THỊ CẢNH BÁO MẤT GÓI */}
            {buyMode === 'BASE' && wallet?.subscriptionPlan !== 'NONE' && !isExpired && PLAN_INFO[selectedPlan].rank < PLAN_INFO[wallet.subscriptionPlan].rank && (
              <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-xs text-error font-bold flex gap-2 items-start">
                <span className="material-symbols-outlined text-lg">warning</span>
                <span>Cảnh báo: Bạn đang dùng gói {PLAN_INFO[wallet.subscriptionPlan].name} đến {new Date(wallet.subscriptionExpiry).toLocaleDateString('vi-VN')}. Nếu đăng ký gói {PLAN_INFO[selectedPlan].name} (thấp hơn) bây giờ, bạn sẽ ngay lập tức MẤT TOÀN BỘ QUYỀN LỢI gói cũ!</span>
              </div>
            )}
            
            {buyMode === 'BASE' && wallet?.extraRoomLimit > 0 && !isExpired && (
              <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-xs text-yellow-700 font-bold flex gap-2 items-start">
                <span className="material-symbols-outlined text-lg">warning</span>
                <span>Chú ý: Mua gói chính mới sẽ hủy {wallet.extraRoomLimit} phòng lẻ mà bạn đã mua trước đó.</span>
              </div>
            )}

            {buyMode === 'RETAIL' && wallet?.subscriptionPlan !== 'NONE' && !isExpired && wallet?.subscriptionPlan !== selectedPlan && (
              <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-xs text-error font-bold flex gap-2 items-start">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>Lỗi: Bạn đang dùng gói {PLAN_INFO[wallet.subscriptionPlan].name}, không thể mua thêm phòng lẻ của gói {PLAN_INFO[selectedPlan].name}. Hãy chọn mua lẻ gói {PLAN_INFO[wallet.subscriptionPlan].name}.</span>
              </div>
            )}

            {buyMode === 'RETAIL' && wallet?.subscriptionPlan !== 'NONE' && !isExpired && wallet?.subscriptionPlan === selectedPlan && (
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-xs text-primary font-bold flex gap-2 items-start">
                <span className="material-symbols-outlined text-lg">info</span>
                <span>Gói lẻ sẽ tự động được ĐỒNG BỘ thời hạn với gói hiện tại (còn khoảng {calculateRetailCost().daysLeft} ngày).</span>
              </div>
            )}

            {/* BẢNG TÍNH TIỀN */}
            <div className="bg-surface-container-low p-4 rounded-2xl space-y-2">
              {buyMode === 'BASE' ? (
                <>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Giá gói {plans[selectedPlan].name}:</span><span className="font-bold">{plans[selectedPlan].price.toLocaleString('vi-VN')} đ/tháng</span></div>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Thành tiền mới ({months} tháng):</span><span className="font-bold">{(plans[selectedPlan].price * months).toLocaleString('vi-VN')} đ</span></div>
                  {calculateUpgradeCost().remainingValue > 0 && (
                    <div className="flex justify-between text-sm text-green-600"><span className="">- Khấu trừ gói cũ còn dư:</span><span className="font-bold">- {calculateUpgradeCost().remainingValue.toLocaleString('vi-VN')} đ</span></div>
                  )}
                  {calculateUpgradeCost().total < 0 && (
                    <div className="text-xs text-error font-bold mt-2 pb-2 border-b border-error/20">
                      * Số tiền dư {Math.abs(calculateUpgradeCost().total).toLocaleString('vi-VN')} đ sẽ không được hoàn lại. Hãy tăng số tháng đăng ký để không bị lãng phí tiền dư!
                    </div>
                  )}
                  <div className="flex justify-between text-lg border-t border-outline-variant/20 pt-2 mt-2"><span className="font-black text-primary">Phải thanh toán:</span><span className="font-black text-error">{Math.max(0, calculateUpgradeCost().total).toLocaleString('vi-VN')} đ</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Giá lẻ {plans[selectedPlan].name}:</span><span className="font-bold">{(plans[selectedPlan].retailPrice || 0).toLocaleString('vi-VN')} đ/phòng/tháng</span></div>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Số lượng phòng:</span><span className="font-bold">x {extraRooms}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Thời gian ({calculateRetailCost().daysLeft} ngày):</span><span className="font-bold">x {(calculateRetailCost().daysLeft / 30).toFixed(1)} tháng</span></div>
                  <div className="flex justify-between text-lg border-t border-outline-variant/20 pt-2 mt-2"><span className="font-black text-primary">Phải thanh toán:</span><span className="font-black text-error">{calculateRetailCost().total.toLocaleString('vi-VN')} đ</span></div>
                </>
              )}
              <p className="text-xs text-on-surface-variant">Số dư ví: <b className={wallet?.balance >= (buyMode === 'BASE' ? Math.max(0, calculateUpgradeCost().total) : calculateRetailCost().total) ? 'text-green-600' : 'text-error'}>{(wallet?.balance||0).toLocaleString('vi-VN')} đ</b></p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={()=>{setShowBuyConfirm(false);setSelectedPlan(null);}} className="flex-1 py-3 border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container-low transition-all">Hủy</button>
              <button 
                onClick={handleBuyPlan} 
                disabled={
                  wallet?.balance < (buyMode === 'BASE' ? Math.max(0, calculateUpgradeCost().total) : calculateRetailCost().total) ||
                  (buyMode === 'RETAIL' && wallet?.subscriptionPlan !== 'NONE' && !isExpired && wallet?.subscriptionPlan !== selectedPlan)
                } 
                className="flex-[2] py-3 bg-primary text-on-primary font-black rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NẠP TIỀN & LỊCH SỬ (Giữ nguyên) */}
      {activeSection === 'deposit' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-lg space-y-6">
          <h3 className="text-xl font-black text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">account_balance_wallet</span>Nạp tiền vào ví</h3>
          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Số tiền muốn nạp (VNĐ)</label>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="VD: 500000" className="w-full p-4 border border-outline-variant/30 rounded-2xl text-lg font-bold focus:ring-2 focus:ring-primary/20 outline-none"/>
            <div className="flex flex-wrap gap-2 mt-2">
              {[100000,200000,500000,1000000].map(v=>(
                <button key={v} onClick={()=>setDepositAmount(v)} className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 hover:border-primary/50 transition-all">{v.toLocaleString('vi-VN')}đ</button>
              ))}
            </div>
          </div>
          {depositAmount > 0 && (
            <button onClick={()=>setShowQR(true)} className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all">Hiện mã QR chuyển khoản</button>
          )}
          {showQR && bankInfo && depositAmount > 0 && (
            <div className="text-center space-y-4 bg-primary/5 p-6 rounded-2xl border-2 border-dashed border-primary/20">
              <p className="text-sm font-bold text-on-surface-variant">Quét mã QR bằng ứng dụng Ngân hàng</p>
              <img src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.bankAccount}-compact.png?amount=${depositAmount}&addInfo=NAPTIEN&accountName=${encodeURIComponent(bankInfo.bankName)}`} alt="VietQR" className="w-64 mx-auto rounded-2xl border-4 border-white shadow-xl"/>
              <p className="text-xs text-on-surface-variant">NH: <b>{bankInfo.bankId}</b> • STK: <b>{bankInfo.bankAccount}</b> • Tên: <b>{bankInfo.bankName}</b></p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Tải lên ảnh minh chứng *</label>
            <input type="file" accept="image/*" onChange={e=>setProofFile(e.target.files[0])} className="w-full p-4 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-2xl text-xs font-bold cursor-pointer"/>
          </div>
          <button onClick={handleDeposit} className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">upload_file</span> Gửi yêu cầu nạp tiền
          </button>
        </div>
      )}

      {activeSection === 'history' && (
        <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10"><h3 className="text-lg font-black text-on-surface">Lịch sử giao dịch</h3></div>
          <div className="divide-y divide-outline-variant/10">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-bold">Chưa có giao dịch nào</div>
            ) : transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type==='DEPOSIT'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined">{tx.type==='DEPOSIT'?'savings':'workspace_premium'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.description}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.amount>0?'text-green-600':'text-error'}`}>{tx.amount>0?'+':''}{tx.amount.toLocaleString('vi-VN')} đ</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${tx.status==='APPROVED'||tx.status==='COMPLETED'?'bg-green-100 text-green-700':tx.status==='PENDING'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{tx.status==='PENDING'?'Chờ duyệt':tx.status==='APPROVED'?'Đã duyệt':tx.status==='COMPLETED'?'Hoàn tất':'Từ chối'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTab;
