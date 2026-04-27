import React from 'react';

/**
 * Component TenantBillsTab
 * Chức năng: Hiển thị danh sách và thống kê hóa đơn dành cho khách thuê.
 * - Thống kê tổng số tiền chưa đóng.
 * - Hiển thị kỳ hạn thanh toán tiếp theo và lần thanh toán gần nhất.
 * - Danh sách lịch sử hóa đơn (Tiền nhà, điện, nước...).
 * - Cho phép lọc hóa đơn theo từng phòng (nếu thuê nhiều phòng).
 * - Nút "Thanh toán ngay" dẫn đến chi tiết hóa đơn để tải minh chứng.
 */
const TenantBillsTab = ({
  tenantBills,      // Danh sách tất cả hóa đơn của khách thuê từ server
  selectedRoomId,   // ID phòng đang chọn để lọc (mặc định là 'ALL')
  setViewBillDetails // Hàm để mở modal xem chi tiết hóa đơn
}) => {
  // Logic lọc hóa đơn theo phòng được chọn
  const activeRoomId = selectedRoomId || 'ALL';
  const filteredBills = activeRoomId === 'ALL' 
    ? tenantBills 
    : tenantBills.filter(b => (b.roomNumberSnapshot || b.contract?.room?.roomNumber || 'Phòng đã xóa') === activeRoomId);
  
  // Sắp xếp hóa đơn mới nhất lên đầu dựa trên ID (hoặc có thể dùng ngày tạo)
  const sortedBills = [...filteredBills].sort((a, b) => b.id - a.id);
  
  // Tính toán số liệu thống kê (Summary Stats)
  const unpaidBills = sortedBills.filter(b => b.status === 'UNPAID');
  const outstandingBalance = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0); // Tổng nợ chưa đóng
  
  const lastPaidBill = sortedBills.find(b => b.status === 'PAID'); // Hóa đơn đã đóng gần nhất
  const nextDueBill = unpaidBills[0]; // Giả định hóa đơn chưa đóng đầu tiên là hóa đơn cần thanh toán tiếp theo

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8">
      {/* Tiêu đề trang */}
      <div className="mb-10">
        <h1 className="font-display-xl text-3xl font-bold text-on-surface mb-2">Thanh toán hóa đơn</h1>
        <p className="font-body-lg text-on-surface-variant">Quản lý tiền thuê nhà và các hóa đơn dịch vụ của bạn.</p>
      </div>

      {/* Các thẻ tóm tắt (Layout Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Thẻ 1: Tổng số dư nợ chưa đóng */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div>
            <div className="flex items-center gap-3 text-on-surface-variant mb-6">
              <span className="material-symbols-outlined text-error p-2 bg-error-container/30 rounded-xl">account_balance_wallet</span>
              <h2 className="font-headline-md text-lg font-bold">Số dư nợ</h2>
            </div>
            <p className="font-display-xl text-3xl font-black text-error mb-1 tracking-tight">
              {outstandingBalance.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
            </p>
            <p className="font-body-sm text-sm text-on-surface-variant flex items-center gap-1">
              {unpaidBills.length > 0 ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-error fill-1">warning</span>
                  Có {unpaidBills.length} hóa đơn chưa đóng
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] text-secondary fill-1">check_circle</span>
                  Tất cả đã thanh toán
                </>
              )}
            </p>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => nextDueBill && setViewBillDetails(nextDueBill)}
              disabled={!nextDueBill}
              className="w-full bg-error text-on-error hover:bg-error/90 font-label-md text-sm py-4 rounded-xl transition-all shadow-lg shadow-error/20 disabled:opacity-30 disabled:shadow-none"
            >
              Thanh toán ngay
            </button>
          </div>
        </div>

        {/* Thẻ 2: Hóa đơn đến hạn tiếp theo */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 text-on-surface-variant mb-6">
              <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed/30 rounded-xl">calendar_month</span>
              <h2 className="font-headline-md text-lg font-bold">Kỳ hạn tiếp theo</h2>
            </div>
            {nextDueBill ? (
              <>
                <p className="font-display-xl text-3xl font-black text-on-surface mb-1 tracking-tight">
                  {nextDueBill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                </p>
                <p className="font-body-sm text-sm text-on-surface-variant">Tháng {nextDueBill.month}/{nextDueBill.year}</p>
              </>
            ) : (
              <p className="text-on-surface-variant italic py-2">Chưa có kỳ hạn mới</p>
            )}
          </div>
          <div className="mt-8">
            <button 
              onClick={() => nextDueBill && setViewBillDetails(nextDueBill)}
              disabled={!nextDueBill}
              className="w-full bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-sm py-4 rounded-xl transition-all border border-primary/10 disabled:opacity-30"
            >
              Xem chi tiết
            </button>
          </div>
        </div>

        {/* Thẻ 3: Thông tin lần đóng tiền gần nhất */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 text-on-surface-variant mb-6">
              <span className="material-symbols-outlined text-secondary p-2 bg-secondary-container/30 rounded-xl">check_circle</span>
              <h2 className="font-headline-md text-lg font-bold">Thanh toán gần nhất</h2>
            </div>
            {lastPaidBill ? (
              <>
                <p className="font-display-xl text-3xl font-black text-on-surface mb-1 tracking-tight">
                  {lastPaidBill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                </p>
                <p className="font-body-sm text-sm text-on-surface-variant">Đã thanh toán kỳ {lastPaidBill.month}/{lastPaidBill.year}</p>
              </>
            ) : (
              <p className="text-on-surface-variant italic py-2">Chưa có dữ liệu</p>
            )}
          </div>
          <div className="mt-8">
            <button 
              onClick={() => lastPaidBill && setViewBillDetails(lastPaidBill)}
              disabled={!lastPaidBill}
              className="w-full text-primary hover:text-surface-tint font-label-md text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              Xem biên lai
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách Lịch sử thanh toán chi tiết */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display-xl text-2xl font-bold text-on-surface">Lịch sử thanh toán</h2>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="w-3 h-3 rounded-full bg-secondary"></span> Đã đóng
            <span className="w-3 h-3 rounded-full bg-error ml-2"></span> Nợ
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {sortedBills.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">payments</span>
              <p className="text-on-surface-variant italic">Bạn chưa có dữ liệu hóa đơn nào.</p>
            </div>
          ) : (
            sortedBills.map((bill) => (
              <div 
                key={bill.id} 
                className={`bg-surface-container-lowest rounded-3xl p-8 border-l-[6px] border-y border-r border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 hover:border-primary/20 transition-all group ${
                  bill.status === 'PAID' ? 'border-l-secondary' : 'border-l-error'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="font-headline-md text-xl font-bold text-on-surface">Tháng {bill.month}/{bill.year}</h3>
                    {/* Hiển thị Badge trạng thái hóa đơn */}
                    {bill.status === 'PAID' ? (
                      <span className="bg-secondary-container text-on-secondary-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] fill-1">check</span>
                        Đã thanh toán
                      </span>
                    ) : bill.status === 'PENDING_CONFIRM' ? (
                      <span className="bg-primary-fixed text-on-primary-fixed font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Chờ duyệt
                      </span>
                    ) : (
                      <span className="bg-error-container text-on-error-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">priority_high</span>
                        Chưa thanh toán
                      </span>
                    )}
                  </div>
                  {/* Chi tiết chỉ số điện nước và ngày tạo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-body-sm text-sm text-on-surface-variant">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Loại</span>
                      <span className="text-on-surface font-bold text-base">
                        {bill.billType === 'ROOM' ? '🏠 Tiền nhà' : bill.billType === 'UTILITY' ? '⚡ Điện nước' : '🧾 Tổng hợp'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Chỉ số Điện</span>
                      <span className="text-on-surface font-medium">{bill.electricityUsage || '---'} ký</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Chỉ số Nước</span>
                      <span className="text-on-surface font-medium">{bill.waterUsage || '---'} khối</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Ngày tạo</span>
                      <span className="text-on-surface font-medium">{new Date(bill.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                {/* Phần tổng tiền và nút xem chi tiết */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-6 border-t lg:border-t-0 border-outline-variant/30 pt-6 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 opacity-60">Tổng cộng</span>
                    <span className={`font-display-xl text-2xl font-black ${bill.status === 'PAID' ? 'text-on-surface' : 'text-error'}`}>
                      {bill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => setViewBillDetails(bill)}
                    className="bg-primary text-on-primary hover:bg-surface-tint font-label-md text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center gap-2 whitespace-nowrap"
                  >
                    Xem chi tiết
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantBillsTab;
