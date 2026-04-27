import React from 'react';

/**
 * Component LandlordBillsTabContent
 * Chức năng: Hiển thị danh sách tất cả các hóa đơn của chủ nhà trong tab "Quản lý Hóa Đơn".
 * - Hiển thị bảng danh sách hóa đơn kèm trạng thái (Đã thu, Chờ duyệt, Chờ thanh toán).
 * - Cho phép xem chi tiết từng hóa đơn.
 */
const LandlordBillsTabContent = ({ 
  activeTab,          // Tab hiện tại đang được chọn trong Sidebar
  bills,              // Danh sách tất cả hóa đơn của chủ nhà
  setViewBillDetails  // Hàm để mở modal xem chi tiết hóa đơn
}) => {
  if (activeTab !== 'LANDLORD_BILLS') return null;

  return (            <div className="p-0">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
                <div>
                  <h2 className="font-display-xl text-3xl font-bold text-on-surface">Quản lý Hóa Đơn & Thu Tiền</h2>
                  <p className="font-body-md text-on-surface-variant mt-1">Quản lý toàn bộ hóa đơn tiền phòng, dịch vụ và theo dõi trạng thái thanh toán.</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 px-5 py-2.5 rounded-full flex items-center gap-2.5 self-start md:self-auto shadow-sm">
                  <span className="text-label-md font-bold text-on-surface-variant">Tổng số:</span>
                  <span className="text-label-md font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">{bills.length}</span>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
                {bills.length === 0 ? (
                  <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant m-8">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">receipt_long</span>
                    <p className="text-on-surface-variant italic font-medium">Chưa có hóa đơn nào được tạo trên hệ thống.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low/50">
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-2/5">Phòng / Căn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[15%]">Kỳ Hóa Đơn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[15%]">Khách Thuê</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Loại Hóa Đơn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Trạng Thái</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[10%]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...bills].reverse().map(bill => (
                        <tr key={bill.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-primary group-hover:text-surface-tint text-base">
                                {(() => {
                                    const base = bill.roomNumberSnapshot || bill.contract?.room?.roomNumber || 'Phòng đã xóa';
                                    const isWhole = (bill.contract?.room?.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(base));
                                    const typeLabel = isWhole ? 'Nhà nguyên căn' : 'Phòng trọ';
                                    if (/phòng|nhà|căn/i.test(base)) return base;
                                    return `${typeLabel} ${base}`;
                                })()}
                            </div>
                            <div className="text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider mt-1">
                              Mã: {bill.roomCodeSnapshot || bill.contract?.room?.roomCode || 'N/A'}
                            </div>
                          </td>
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-base">Tháng {bill.month}/{bill.year}</div>
                          </td>
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-sm">{bill.tenantNameSnapshot || bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Khách cũ'}</div>
                            <div className="text-xs text-on-surface-variant font-medium mt-0.5">{bill.contract?.tenantEmail || '...'}</div>
                            <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</div>
                          </td>
                          
                          <td className="py-4 px-8 text-center">
                            {bill.billType === 'ROOM' ? (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/20">
                               <span className="material-symbols-outlined text-[14px]">home</span>
                               Tiền phòng
                               </span>
                            ) : bill.billType === 'UTILITY' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-tertiary/20">
                              <span className="material-symbols-outlined text-[14px]">bolt</span>
                              Tiền điện nước
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-[11px] font-bold uppercase tracking-wider border border-outline-variant/30">
                              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                              Tổng hợp
                              </span>
                            )}
                          </td>
                          
                          <td className="py-4 px-8 text-center">
                            {bill.status === 'PAID' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Đã thu tiền
                              </span>
                            ) : bill.status === 'PENDING_CONFIRM' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/50 text-primary font-label-md text-[11px] font-bold uppercase tracking-wider border border-primary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Chờ duyệt
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
                              Xem
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          
  );
};

export default LandlordBillsTabContent;