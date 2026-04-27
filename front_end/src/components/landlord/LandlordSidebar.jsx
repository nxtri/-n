import React from 'react';

/**
 * Component LandlordSidebar
 * Chức năng: Thanh điều hướng bên trái dành riêng cho chủ nhà.
 * - Hiển thị các menu chính: Quản lý phòng, Người thuê, Sự cố, Tài chính.
 * - Hỗ trợ các menu con dạng xổ xuống (Accordion) cho Quản lý phòng và Tài chính.
 * - Hiển thị số lượng phòng tương ứng với từng trạng thái lọc.
 */
const LandlordSidebar = ({
  activeTab,             // ID của tab đang được chọn (để highlight menu)
  setActiveTab,          // Hàm chuyển đổi tab khi nhấn vào menu
  rooms,                 // Danh sách phòng (để tính toán số lượng cho từng mục menu)
  contracts,             // Danh sách hợp đồng (để lọc phòng sắp trống)
  isRoomMenuOpen,        // State điều khiển việc đóng/mở menu Quản lý phòng
  setIsRoomMenuOpen,     // Hàm cập nhật state đóng/mở menu Quản lý phòng
  isFinanceMenuOpen,     // State điều khiển việc đóng/mở menu Tài chính
  setIsFinanceMenuOpen,  // Hàm cập nhật state đóng/mở menu Tài chính
}) => {
  return (
    <>
      {/* MENU QUẢN LÝ PHÒNG (CÓ XỔ XUỐNG) */}
      <div
        onClick={() => setIsRoomMenuOpen(!isRoomMenuOpen)}
        className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all ${isRoomMenuOpen ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px]">real_estate_agent</span>
          Quản lý phòng
        </span>
        <span className="text-on-surface-variant opacity-60 material-symbols-outlined text-[20px] transition-transform">
          {isRoomMenuOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isRoomMenuOpen && (
        <div className="pb-4 pt-1 flex flex-col gap-1.5">
          {[
            { id: 'ALL_ROOMS', label: 'Tất cả phòng', count: rooms.length },
            { id: 'RENTED', label: 'Đang cho thuê', count: rooms.filter(r => r.status === 'RENTED' && !r.isHidden).length },
            { id: 'AVAILABLE', label: 'Phòng trống', count: rooms.filter(r => r.status === 'AVAILABLE' && !r.isHidden && (!r.depositNote || r.depositNote.trim() === '')).length },
            { id: 'DEPOSITED', label: 'Phòng đã cọc', count: rooms.filter(r => r.depositNote && r.depositNote.trim() !== '' && !r.isHidden).length },
            { id: 'UPCOMING', label: 'Sắp trống', count: rooms.filter(r => r.status === 'RENTED' && !r.isHidden && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate)).length },
            { id: 'HIDDEN', label: 'Phòng bị ẩn', count: rooms.filter(r => r.isHidden).length },
            { id: 'MAINTENANCE', label: 'Đang bảo trì', count: rooms.filter(r => r.status === 'MAINTENANCE' && !r.isHidden).length }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${activeTab === tab.id ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
            >
              <span className="flex items-center gap-2">{tab.label}</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-primary/10' : 'bg-surface-container-high'}`}>
                {tab.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* NGƯỜI THUÊ */}
      <div
        onClick={() => setActiveTab('TENANTS')}
        className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'TENANTS' ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px]">groups</span>
        Người thuê
      </div>

      {/* SỰ CỐ */}
      <div
        onClick={() => setActiveTab('INCIDENTS')}
        className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'INCIDENTS' ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px]">engineering</span>
        Quản lý Sự cố
      </div>

      {/* VÍ & GÓI DỊCH VỤ */}
      <div
        onClick={() => setActiveTab('WALLET')}
        className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'WALLET' ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
        Ví & Gói Dịch Vụ
      </div>

      {/* MENU TÀI CHÍNH (CÓ XỔ XUỐNG) */}
      <div
        onClick={() => setIsFinanceMenuOpen(!isFinanceMenuOpen)}
        className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all ${isFinanceMenuOpen ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          Tài chính
        </span>
        <span className="text-on-surface-variant opacity-60 material-symbols-outlined text-[20px] transition-transform">
          {isFinanceMenuOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isFinanceMenuOpen && (
        <div className="pb-4 pt-1 flex flex-col gap-1.5">
          <div
            onClick={() => setActiveTab('LANDLORD_BILLS')}
            className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all ${activeTab === 'LANDLORD_BILLS' ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
          >
            Hóa đơn & Thu tiền
          </div>
          <div
            onClick={() => setActiveTab('LANDLORD_REVENUE')}
            className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all ${activeTab === 'LANDLORD_REVENUE' ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
          >
            Báo cáo Doanh thu
          </div>
        </div>
      )}
    </>
  );
};

export default LandlordSidebar;
