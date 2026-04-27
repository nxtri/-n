import React from 'react';

/**
 * Component RoomMetricsCards
 * Chức năng: Hiển thị 3 thẻ thống kê quan trọng ở phía trên cùng của Dashboard.
 * - Tổng số phòng: Tổng số lượng phòng chủ nhà đang quản lý.
 * - Tỷ lệ lấp đầy: Phần trăm số phòng đã được thuê trên tổng số.
 * - Doanh thu dự kiến: Tổng tiền phòng của các hợp đồng đang hoạt động.
 */
const RoomMetricsCards = ({ 
  metrics // Đối tượng chứa các con số thống kê { total, occupancyRate, revenue }
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Tổng số phòng */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-primary/30 transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-primary-container/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[32px]">real_estate_agent</span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Tổng số phòng</p>
          <h3 className="text-3xl font-black text-on-surface mt-1">{metrics.total}</h3>
        </div>
      </div>

      {/* Tỷ lệ lấp đầy */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-secondary/30 transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[32px]">check_circle</span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Tỷ lệ lấp đầy</p>
          <h3 className="text-3xl font-black text-on-surface mt-1">{metrics.rate}%</h3>
        </div>
      </div>

      {/* Doanh thu dự kiến */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-tertiary/30 transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-tertiary-container/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[32px]">payments</span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Doanh thu dự kiến</p>
          <h3 className="text-3xl font-black text-on-surface mt-1">
            {metrics.revenue.toLocaleString()} <span className="text-sm font-normal">đ</span>
          </h3>
        </div>
      </div>
    </div>
  );
};

export default RoomMetricsCards;
