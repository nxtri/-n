import React, { useState } from 'react';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component LandlordRevenueTabContent
 * Chức năng: Hiển thị báo cáo doanh thu chi tiết cho chủ nhà.
 * - Thống kê tổng doanh thu (tiền phòng, điện nước).
 * - Thống kê tổng nợ (hóa đơn chưa thanh toán).
 * - Thống kê chi phí sửa chữa/bảo trì từ các sự cố.
 * - Hiển thị biểu đồ và danh sách doanh thu chi tiết theo từng phòng.
 * - Cho phép lọc theo tháng, năm và tìm kiếm phòng.
 */
const LandlordRevenueTabContent = ({ 
  activeTab,                 // Tab hiện tại đang được chọn
  setViewBillDetails,        // Hàm để xem chi tiết hóa đơn trong báo cáo
  setViewIncidentCostDetails // Hàm để xem chi tiết chi phí sửa chữa sự cố
}) => {
  const { user, bills, landlordIncidents, rooms, transactions = [] } = useDashboardContext();
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportSearch, setReportSearch] = useState('');
  const [expandedRooms, setExpandedRooms] = useState({});

  if (activeTab !== 'LANDLORD_REVENUE' || user?.role !== 'LANDLORD') return null;

  const toggleRoomAccordion = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // 1. LỌC HÓA ĐƠN THEO THÁNG/NĂM CHỦ NHÀ ĐANG CHỌN
  const filteredBills = bills.filter(b => 
    (reportMonth === 'ALL' || Number(b.month) === Number(reportMonth)) &&
    (reportYear === 'ALL' || Number(b.year) === Number(reportYear))
  );

  // 2. LỌC SỰ CỐ CÓ CHI PHÍ THEO THÁNG/NĂM (dựa vào createdAt của sự cố)
  const filteredIncidents = landlordIncidents.filter(inc => {
    if (!inc.repairCost || inc.repairCost <= 0) return false;
    const incDate = new Date(inc.createdAt);
    const incMonth = incDate.getMonth() + 1;
    const incYear = incDate.getFullYear();
    return (
      (reportMonth === 'ALL' || Number(incMonth) === Number(reportMonth)) &&
      (reportYear === 'ALL' || Number(incYear) === Number(reportYear))
    );
  });

  // 2.5 LỌC GIAO DỊCH MUA GÓI THEO THÁNG/NĂM
  const filteredSubscriptions = transactions.filter(tx => {
    if (tx.type !== 'SUBSCRIPTION' || tx.status !== 'COMPLETED') return false;
    const txDate = new Date(tx.createdAt);
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();
    return (
      (reportMonth === 'ALL' || Number(txMonth) === Number(reportMonth)) &&
      (reportYear === 'ALL' || Number(txYear) === Number(reportYear))
    );
  });

  // 3. TÍNH TỔNG CÁC THẺ CHỈ SỐ
  let totalRoomRevenue = 0;
  let totalUtilityRevenue = 0;
  let grandTotalDebt = 0;

  filteredBills.forEach(bill => {
    const amount = bill.totalAmount || 0;
    if (bill.status === 'PAID') {
      if (bill.billType === 'UTILITY') totalUtilityRevenue += amount;
      else totalRoomRevenue += amount;
    } else {
      grandTotalDebt += amount;
    }
  });

  // Tổng chi phí phát sinh
  const totalRepairCost = filteredIncidents.reduce((sum, inc) => sum + (Number(inc.repairCost) || 0), 0);

  // Tổng chi phí mua gói
  const totalSubscriptionCost = filteredSubscriptions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  // TỔNG DOANH THU = Tiền phòng + Điện nước - Chi phí phát sinh - Chi phí mua gói
  const grandTotalRevenue = totalRoomRevenue + totalUtilityRevenue - totalRepairCost - totalSubscriptionCost;

  // 4. GHÉP HÓA ĐƠN VÀO TỪNG PHÒNG DỰA TRÊN SNAPSHOT
  const roomGroups = {};
  
  filteredBills.forEach(bill => {
    const rName = bill.roomNumberSnapshot || (bill.contract?.room ? `Phòng ${bill.contract.room.roomNumber}` : 'Phòng đã xóa');
    if (!roomGroups[rName]) {
      roomGroups[rName] = { 
        id: rName,
        roomNumber: rName, 
        address: bill.contract?.room?.address || '', 
        roomType: bill.contract?.room?.roomType || 'SINGLE',
        roomCode: bill.roomCodeSnapshot || bill.contract?.room?.roomCode || '',
        bills: [], 
        incidentCosts: [],
        roomTotalRevenue: 0 
      };
    }
    roomGroups[rName].bills.push(bill);
    if (bill.status === 'PAID') {
      roomGroups[rName].roomTotalRevenue += (bill.totalAmount || 0);
    }
  });

  // GÁN SỰ CỐ CHI PHÍ VÀO NHÓM PHÒNG TƯƠNG ỨNG
  filteredIncidents.forEach(inc => {
    const incRoomNum = String(inc.room?.roomNumber || '');
    const matchedKey = Object.keys(roomGroups).find(k =>
      k.toLowerCase().includes(incRoomNum.toLowerCase()) && incRoomNum !== ''
    );
    const targetKey = matchedKey || `Phòng ${incRoomNum || 'không rõ'}`;

    if (!roomGroups[targetKey]) {
      roomGroups[targetKey] = {
        id: targetKey,
        roomNumber: targetKey,
        address: inc.room?.address || '',
        roomType: inc.room?.roomType || 'SINGLE',
        roomCode: inc.room?.roomCode || '',
        bills: [],
        incidentCosts: [],
        roomTotalRevenue: 0
      };
    }
    if (!roomGroups[targetKey].incidentCosts) roomGroups[targetKey].incidentCosts = [];
    roomGroups[targetKey].incidentCosts.push(inc);
  });

  // Biến object thành mảng để hiển thị
  let reportData = Object.values(roomGroups);

  // Áp dụng bộ lọc tìm kiếm
  if (reportSearch.trim() !== '') {
    const keyword = reportSearch.toLowerCase();
    reportData = reportData.filter(r => 
      r.roomNumber.toLowerCase().includes(keyword) || 
      (r.address && r.address.toLowerCase().includes(keyword))
    );
  }

  return (
    <div className="p-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
        <div>
          <h2 className="font-display-xl text-3xl font-bold text-on-surface">Báo cáo Doanh Thu</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Theo dõi dòng tiền, phân tích thu chi và hiệu quả kinh doanh.</p>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col lg:flex-row gap-6 items-center mb-8">
        <div className="relative w-full lg:flex-1 group">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px]">search</span>
          <input 
            type="text" 
            placeholder="Tìm theo số phòng, số nhà, ngõ, phường..." 
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:opacity-50"
          />
        </div>
        <div className="flex flex-wrap w-full lg:w-auto gap-4">
          <div className="relative flex-1 lg:flex-none">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">calendar_month</span>
            <select 
              value={reportMonth} 
              onChange={(e) => setReportMonth(e.target.value)} 
              className="w-full appearance-none pl-12 pr-10 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer"
            >
              <option value="ALL">Cả năm</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
          </div>
          <div className="relative flex-1 lg:flex-none">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">calendar_today</span>
            <select 
              value={reportYear} 
              onChange={(e) => setReportYear(e.target.value)} 
              className="w-full appearance-none pl-12 pr-10 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các năm</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* 5 THẺ TỔNG QUAN (Metrics Bento Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-10">
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-primary/30 transition-all col-span-2 md:col-span-1 lg:col-span-1 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Tổng Doanh Thu</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-primary mt-1 tracking-tight">{grandTotalRevenue.toLocaleString('vi-VN')} đ</h3>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60">= Phòng + Điện nước - Chi phí</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-secondary/30 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Từ Tiền Phòng</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-secondary mt-1 tracking-tight">{totalRoomRevenue.toLocaleString('vi-VN')} đ</h3>
           </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-tertiary/30 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Từ Điện Nước</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-tertiary mt-1 tracking-tight">{totalUtilityRevenue.toLocaleString('vi-VN')} đ</h3>
           </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-error/30 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Khách Đang Nợ</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-error mt-1 tracking-tight">{grandTotalDebt.toLocaleString('vi-VN')} đ</h3>
           </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-[#f97316]/30 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f97316]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 text-[#f97316] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">handyman</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chi Phí Sửa Chữa</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-[#f97316] mt-1 tracking-tight">{totalRepairCost.toLocaleString('vi-VN')} đ</h3>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60">{filteredIncidents.length} sự cố</p>
           </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-amber-600/30 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-600/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chi Phí Mua Gói</p>
            <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-amber-600 mt-1 tracking-tight">{totalSubscriptionCost.toLocaleString('vi-VN')} đ</h3>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60">{filteredSubscriptions.length} lượt mua</p>
           </div>
        </div>
      </div>

      {/* DANH SÁCH TỪNG PHÒNG (ACCORDION VIEW) */}
      <div className="flex flex-col gap-6">
        {reportData.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">analytics</span>
            <p className="text-on-surface-variant italic font-medium">Không tìm thấy dữ liệu phòng nào phù hợp.</p>
          </div>
        ) : (
          reportData.map((room, index) => (
            <div key={room.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
              
              <div 
                onClick={() => toggleRoomAccordion(room.id)}
                className={`px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all ${expandedRooms[room.id] ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/30'}`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px] font-bold">room_preferences</span>
                  </div>
                  <div className="min-w-0">
                      <h3 className="font-headline-md text-xl font-black text-on-surface flex items-center gap-2">
                        {index + 1}. {(() => {
                          const isWhole = room.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(room.roomNumber);
                          const typeLabel = isWhole ? 'Nhà nguyên căn' : 'Phòng trọ';
                          const rNum = room.roomNumber;
                          const displayName = /phòng|nhà|căn/i.test(rNum) ? rNum : `${typeLabel} ${rNum}`;
                          return room.roomCode ? `${displayName} [${room.roomCode}]` : displayName;
                        })()}
                      </h3>
                      <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span> {room.address || 'Không có địa chỉ'}
                      </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-outline-variant/30 pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Đã thu kỳ này</span>
                    <span className={`text-xl font-black ${room.roomTotalRevenue > 0 ? 'text-secondary' : 'text-on-surface-variant opacity-50'}`}>
                      {room.roomTotalRevenue > 0 ? `${room.roomTotalRevenue.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
                  </div>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-surface-container transition-all ${expandedRooms[room.id] ? 'rotate-180 bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>

              {expandedRooms[room.id] && (
                <div className="overflow-x-auto border-t border-outline-variant/30">
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-outline-variant bg-surface-container-low/50">
                      <tr>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Kỳ Hóa Đơn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Khách Thuê</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Loại / Hạng Mục</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Trạng Thái</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-base">Tháng {bill.month}/{bill.year}</div>
                          </td>
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-sm">{bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Không rõ'}</div>
                            <div className="text-xs text-on-surface-variant font-medium mt-0.5">{bill.contract?.tenantEmail || '...'}</div>
                            <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</div>
                          </td>
                          <td className="py-4 px-8 text-center">
                            {bill.billType === 'UTILITY' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-tertiary/20">
                              <span className="material-symbols-outlined text-[14px]">bolt</span>
                              Tiền điện nước
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/20">
                              <span className="material-symbols-outlined text-[14px]">home</span>
                              Tiền phòng
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-8 text-center">
                            {bill.status === 'PAID' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Đã thu tiền
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container/50 text-error font-label-md text-[11px] font-bold uppercase tracking-wider border border-error/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                Chờ thanh toán
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-8 text-center">
                            <button 
                              onClick={() => setViewBillDetails(bill)} 
                              className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-label-md text-[12px] px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 mx-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Xem Hóa Đơn
                            </button>
                          </td>
                        </tr>
                      ))}

                      {(room.incidentCosts || []).map((inc) => {
                        const incDate = new Date(inc.createdAt);
                        const incMonth = incDate.getMonth() + 1;
                        const incYear = incDate.getFullYear();
                        return (
                          <tr key={`inc-${inc.id}`} className="bg-[#fff7ed]/50 hover:bg-[#fff7ed] transition-colors group border-b border-outline-variant/30 last:border-0">
                            <td className="py-4 px-8">
                              <div className="font-bold text-[#c2410c] text-base">Tháng {incMonth}/{incYear}</div>
                            </td>
                            <td className="py-4 px-8">
                              <div className="font-bold text-on-surface text-sm">{inc.tenant?.fullName || 'Không rõ'}</div>
                              <div className="text-xs text-on-surface-variant font-medium mt-0.5">{inc.tenant?.email || 'Không có email'}</div>
                              <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {inc.tenant?.phone || '...'}</div>
                            </td>
                            <td className="py-4 px-8 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffedd5] text-[#c2410c] font-label-md text-[11px] font-bold uppercase tracking-wider border border-[#fed7aa]">
                                <span className="material-symbols-outlined text-[14px]">build</span>
                                Chi phí phát sinh
                              </span>
                            </td>
                            <td className="py-4 px-8 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Hoàn thành
                              </span>
                            </td>
                            <td className="py-4 px-8 text-center">
                              <button
                                onClick={() => setViewIncidentCostDetails(inc)}
                                className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-label-md text-[12px] px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 mx-auto"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {room.bills.length === 0 && (room.incidentCosts || []).length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-12 px-8 text-center">
                            <p className="text-on-surface-variant italic font-medium">Phòng này chưa có phát sinh hóa đơn nào trong kỳ này.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LandlordRevenueTabContent;