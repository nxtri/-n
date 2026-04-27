import React from 'react';

/**
 * COMPONENT: AdminStatsTab
 * Chức năng: Hiển thị báo cáo thống kê tổng quan và chi tiết của hệ thống.
 * Các tính năng chính:
 * 1. Lọc dữ liệu thống kê theo Tháng và Năm.
 * 2. Thống kê Doanh thu Nền tảng (Tiền nạp, Doanh thu bán gói, Số dư ví, Phân bổ gói).
 * 3. Thống kê số lượng người dùng (Chủ nhà, Khách thuê, Tài khoản mới, Tài khoản bị khóa).
 * 4. Thống kê tình trạng phòng trọ (Tổng số phòng, Đang thuê, Trống, Bị ẩn).
 * 5. Báo cáo dòng tiền Chủ nhà (Tổng doanh thu, Tiền phòng, Tiền điện nước, Tổng nợ).
 */
const AdminStatsTab = ({ 
  filterMonth,    // Giá trị tháng đang lọc
  setFilterMonth, // Hàm cập nhật lọc tháng
  filterYear,     // Giá trị năm đang lọc
  setFilterYear,  // Hàm cập nhật lọc năm
  stats           // Đối tượng chứa dữ liệu thống kê từ API
}) => {
  if (!stats) return <div className="text-center p-10 font-bold opacity-60">Đang tải thống kê...</div>;

  // Helper: Tên gói dịch vụ hiển thị đẹp
  const planLabels = {
    NONE: { name: 'Chưa mua gói', color: 'text-on-surface-variant', bg: 'bg-surface-container-high', icon: 'block' },
    BRONZE: { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-100', icon: 'workspace_premium' },
    SILVER: { name: 'Bạc', color: 'text-slate-500', bg: 'bg-slate-100', icon: 'workspace_premium' },
    GOLD: { name: 'Vàng', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'workspace_premium' },
    DIAMOND: { name: 'Kim Cương', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: 'diamond' },
  };

  const systemStats = stats.systemStats || {};
  const planStats = systemStats.planStats || {};
  const totalLandlords = stats.users?.totalLandlords || 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
      
      {/* PHẦN 1: BỘ LỌC THỜI GIAN (THÁNG/NĂM) */}
      <div className="flex flex-wrap gap-4 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] items-center border border-outline-variant/30">
        <span className="font-black text-on-surface text-[15px] flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span> Lọc theo thời gian:</span>
        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface outline-none font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
        >
          <option value="ALL">Tất cả tháng</option>
          {[...Array(12)].map((_, i) => (
            <option key={i+1} value={i+1}>Tháng {i+1}</option>
          ))}
        </select>
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface outline-none font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
      </div>

      {/* ================================================ */}
      {/* PHẦN 2: DOANH THU NỀN TẢNG (SYSTEM REVENUE)    */}
      {/* ================================================ */}
      <div className="bg-gradient-to-br from-primary/5 via-surface-container-lowest to-yellow-50/30 p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-primary/20">
        <h3 className="m-0 mb-8 text-on-surface text-xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary fill-1">diamond</span> Doanh Thu Nền Tảng (Admin)
        </h3>

        {/* 3 thẻ chính: Tiền nạp, Doanh thu, Số dư ví */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Thẻ 1: Tổng tiền nạp */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-[3rem] group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-xl">savings</span>
              </span>
              <span className="text-[12px] font-black text-blue-600 uppercase tracking-wider">Tổng tiền nạp</span>
            </div>
            <div className="text-[28px] font-black text-blue-700 leading-tight">
              {(systemStats.totalDeposit || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-blue-500/70 font-bold mt-2">Deposit đã duyệt</div>
          </div>

          {/* Thẻ 2: Doanh thu bán gói */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-[3rem] group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-xl">payments</span>
              </span>
              <span className="text-[12px] font-black text-emerald-600 uppercase tracking-wider">Doanh thu bán gói</span>
            </div>
            <div className="text-[28px] font-black text-emerald-700 leading-tight">
              {(systemStats.systemRevenue || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-emerald-500/70 font-bold mt-2">Lợi nhuận thực tế</div>
          </div>

          {/* Thẻ 3: Số dư ví Chủ nhà */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-[3rem] group-hover:bg-amber-500/10 transition-colors"></div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-xl">account_balance_wallet</span>
              </span>
              <span className="text-[12px] font-black text-amber-600 uppercase tracking-wider">Số dư ví chủ nhà</span>
            </div>
            <div className="text-[28px] font-black text-amber-700 leading-tight">
              {(systemStats.totalWalletBalance || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-amber-500/70 font-bold mt-2">Tiền đọng chưa sử dụng</div>
          </div>
        </div>

        {/* Phân bổ gói dịch vụ */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-outline-variant/20">
          <h4 className="m-0 mb-5 text-on-surface text-[15px] font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">workspace_premium</span> Phân Bổ Gói Dịch Vụ Chủ Nhà
          </h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(planLabels).map(([key, plan]) => {
              const count = planStats[key] || 0;
              const pct = totalLandlords > 0 ? ((count / totalLandlords) * 100).toFixed(0) : 0;
              return (
                <div key={key} className={`flex items-center gap-3 px-5 py-3 rounded-xl ${plan.bg} border border-outline-variant/20 min-w-[160px]`}>
                  <span className={`material-symbols-outlined text-[22px] ${plan.color} fill-1`}>{plan.icon}</span>
                  <div>
                    <div className={`text-[13px] font-black ${plan.color}`}>{plan.name}</div>
                    <div className="text-[12px] font-bold text-on-surface-variant">{count} chủ nhà ({pct}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PHẦN 3: THỐNG KÊ NGƯỜI DÙNG & PHÒNG TRỌ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 text-center flex flex-col items-center">
          <div className="text-[48px] font-black text-primary mb-2 leading-none drop-shadow-sm">{stats.users.totalTenants + stats.users.totalLandlords}</div>
          <div className="text-on-surface font-black text-lg mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">groups</span> Tổng Người Dùng</div>
          <div className="text-[14px] text-on-surface-variant font-medium mb-6">{stats.users.totalTenants} Khách thuê | {stats.users.totalLandlords} Chủ nhà</div>
          
          <div className="w-full grid grid-cols-2 gap-4 mt-auto">
            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex flex-col gap-1 items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-error">lock</span>
              <div className="text-[13px] text-error font-black text-center leading-tight">Khóa: {stats.users.lockedTenants} Khách<br/>{stats.users.lockedLandlords} Chủ nhà</div>
            </div>
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex flex-col gap-1 items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-success">person_add</span>
              <div className="text-[13px] text-success font-black text-center leading-tight">Người dùng mới<br/><span className="text-[16px]">{stats.users.newUsers}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 text-center flex flex-col items-center">
          <div className="text-[48px] font-black text-success mb-2 leading-none drop-shadow-sm">{stats.rooms.totalRooms}</div>
          <div className="text-on-surface font-black text-lg mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">real_estate_agent</span> Tổng Phòng Trọ</div>
          <div className="text-[14px] text-on-surface-variant font-medium mb-6">{stats.rooms.rentedRooms} Đang cho thuê | {stats.rooms.availableRooms} Trống</div>
          
          <div className="w-full p-4 bg-secondary/10 border border-secondary/20 rounded-2xl mt-auto flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-secondary">visibility_off</span>
            <div className="text-[14px] text-secondary font-black">Bị ẩn (vi phạm): {stats.rooms.hiddenRooms} phòng</div>
          </div>
        </div>
      </div>

      {/* PHẦN 4: DÒNG TIỀN CHỦ NHÀ (Tiền phòng & Dịch vụ) */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <h3 className="m-0 mb-8 text-on-surface text-xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-primary">trending_up</span> Dòng Tiền Của Chủ Nhà (Tiền phòng & Dịch vụ)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cột 1: Tổng Doanh Thu */}
          <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-primary border border-outline-variant/30 flex flex-col justify-between">
            <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">account_balance</span> Tổng doanh thu</div>
            <div className="text-[28px] font-black text-primary leading-tight break-words">
              {stats.revenueStats.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-on-surface-variant/70 font-bold mt-2">= Phòng + Điện nước</div>
          </div>

          {/* Cột 2: Từ tiền phòng */}
          <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-success border border-outline-variant/30 flex flex-col justify-between">
            <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">meeting_room</span> Từ tiền phòng</div>
            <div className="text-[28px] font-black text-success leading-tight break-words">
              {stats.revenueStats.roomRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Cột 3: Từ điện nước */}
          <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-info border border-outline-variant/30 flex flex-col justify-between">
            <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">water_drop</span> Từ điện nước</div>
            <div className="text-[28px] font-black text-info leading-tight break-words">
              {stats.revenueStats.utilityRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Cột 4: Khách đang nợ */}
          <div className="bg-error/5 p-6 rounded-2xl border-l-[6px] border-l-error border border-error/20 flex flex-col justify-between">
            <div className="text-[12px] font-black text-error uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">money_off</span> Khách đang nợ</div>
            <div className="text-[28px] font-black text-error leading-tight break-words">
              {stats.revenueStats.totalDebt.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminStatsTab;
