import React from 'react';

/**
 * Component TenantSidebar
 * Chức năng: Thanh điều hướng bên trái dành riêng cho giao diện Khách thuê.
 * - Chuyển đổi giữa các tab chính: Phòng đang thuê, Sự cố & Hỗ trợ, Thanh toán.
 * - Menu con "Thanh toán" cho phép xem hóa đơn của tất cả các phòng hoặc từng phòng cụ thể.
 * - Hiển thị badge (số thông báo đỏ) cho các hóa đơn chưa thanh toán.
 */
const TenantSidebar = ({
  activeTab,                // Tab hiện đang được chọn (TENANT_ROOMS, INCIDENTS, TENANT_BILLS)
  setActiveTab,             // Hàm cập nhật tab đang chọn
  isTenantBillsMenuOpen,    // State điều khiển việc mở/đóng menu con của mục Thanh toán
  setIsTenantBillsMenuOpen, // Hàm cập nhật state đóng/mở menu con
  tenantRoomsList,          // Danh sách các phòng mà khách đang thuê (để hiển thị trong menu con)
  selectedRoomId,           // ID phòng đang chọn để xem hóa đơn (ALL hoặc ID cụ thể)
  setSelectedRoomId,        // Hàm cập nhật ID phòng đang chọn
  totalTenantUnpaid,        // Tổng số hóa đơn chưa thanh toán của tất cả các phòng
}) => {
  return (
    <>
      {/* 1. MỤC: PHÒNG ĐANG THUÊ */}
      <div
        onClick={() => setActiveTab('TENANT_ROOMS')}
        className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'TENANT_ROOMS' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px]">home</span>
        Phòng đang thuê
      </div>

      {/* 2. MỤC: SỰ CỐ & HỖ TRỢ */}
      <div
        onClick={() => setActiveTab('INCIDENTS')}
        className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'INCIDENTS' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px]">support_agent</span>
        Sự cố & Hỗ trợ
      </div>

      {/* 3. MỤC: THANH TOÁN HÓA ĐƠN (CÓ MENU XỔ XUỐNG) */}
      <div
        onClick={() => {
          setActiveTab('TENANT_BILLS');
          setIsTenantBillsMenuOpen(!isTenantBillsMenuOpen); // Đảo ngược trạng thái đóng/mở
          if (!selectedRoomId) setSelectedRoomId('ALL'); // Mặc định chọn 'Tất cả' khi mới vào
        }}
        className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all mt-2 ${activeTab === 'TENANT_BILLS' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          Thanh toán
        </span>
        <span className="material-symbols-outlined text-[20px] opacity-80 transition-transform">
          {/* Icon mũi tên xoay theo trạng thái đóng/mở */}
          {isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {/* HIỂN THỊ MENU CON KHI MỤC THANH TOÁN ĐƯỢC CHỌN VÀ ĐANG MỞ */}
      {isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' && (
        <div className="flex flex-col gap-1.5 mt-2">
          {/* Lựa chọn: Tất cả các hóa đơn */}
          <div
            onClick={() => setSelectedRoomId('ALL')}
            className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${(!selectedRoomId || selectedRoomId === 'ALL') ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
          >
            <span className="flex items-center gap-2">Tất cả</span>
            {/* Hiển thị số lượng hóa đơn chưa đóng nếu có */}
            {totalTenantUnpaid > 0 && (
              <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest">
                {totalTenantUnpaid}
              </span>
            )}
          </div>

          {/* Hiển thị danh sách từng phòng cụ thể */}
          {tenantRoomsList.map(room => (
            <div
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${selectedRoomId === room.id ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
            >
              <span className="flex items-center gap-2">{room.roomNumber}</span>
              {/* Hiển thị số hóa đơn nợ riêng của từng phòng */}
              {room.unpaidCount > 0 && (
                <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest">
                  {room.unpaidCount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default TenantSidebar;
