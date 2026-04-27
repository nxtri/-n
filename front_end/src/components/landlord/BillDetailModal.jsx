import React from 'react';

/**
 * Component BillDetailModal
 * Chức năng: Hiển thị cửa sổ chi tiết của một hóa đơn cụ thể.
 * - Cho phép xem bảng kê chi tiết (tiền phòng, điện, nước, dịch vụ).
 * - Khách thuê: Có thể quét mã QR để thanh toán và tải lên ảnh minh chứng.
 * - Chủ nhà: Có thể xem ảnh minh chứng và xác nhận đã thu tiền.
 */
const BillDetailModal = ({
  bill,               // Đối tượng dữ liệu hóa đơn cần hiển thị
  user,               // Thông tin người dùng hiện tại (để phân quyền Chủ nhà/Khách thuê)
  proofFiles,         // State chứa danh sách các file ảnh minh chứng đang được chọn
  setProofFiles,      // Hàm cập nhật danh sách file ảnh minh chứng
  setViewBillDetails, // Hàm để đóng modal (set về null)
  handleUploadProof,  // Hàm xử lý khi khách thuê gửi ảnh minh chứng
  handlePayBill,      // Hàm xử lý khi chủ nhà xác nhận đã thu tiền
}) => {
  if (!bill) return null;

  const contract = bill.contract;

  const elecUsage = bill.electricityUsage || 0;
  const waterUsage = bill.waterUsage || 0;
  const vehicleCount = bill.vehicleCount || contract?.vehicleCount || 0;

  const elecPrice = contract?.electricityPrice || 0;
  const waterPrice = contract?.waterPrice || 0;
  const parkingPrice = contract?.parkingPrice || 0;

  const elecAmount = elecUsage * elecPrice;
  const waterAmount = waterUsage * waterPrice;
  const parkingAmount = vehicleCount * parkingPrice;
  const internetAmount = contract?.internetPrice || 0;
  const serviceAmount = contract?.servicePrice || 0;
  const roomAmount = contract?.price || 0;

  let calculatedTotal = 0;
  if (bill.billType === 'ROOM') {
    calculatedTotal = roomAmount + parkingAmount + internetAmount + serviceAmount;
  } else if (bill.billType === 'UTILITY') {
    calculatedTotal = elecAmount + waterAmount;
  } else {
    calculatedTotal = roomAmount + elecAmount + waterAmount + parkingAmount + internetAmount + serviceAmount;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 overflow-hidden">
      <div
        className="bg-white w-full max-w-[700px] max-h-[90vh] rounded-[2rem] flex flex-col shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Chi tiết Hóa Đơn</h2>
              <div className="flex items-center gap-2 mt-1">
                {bill.status === 'PAID' ? (
                  <span className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">Đã thu tiền</span>
                ) : bill.status === 'PENDING_CONFIRM' ? (
                  <span className="px-3 py-1 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">Chờ xác nhận</span>
                ) : (
                  <span className="px-3 py-1 bg-error text-on-error text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">Chưa thanh toán</span>
                )}
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">
                  • {bill.billType === 'ROOM' ? 'Hóa đơn tiền nhà' : (bill.billType === 'UTILITY' ? 'Hóa đơn dịch vụ' : 'Hóa đơn tổng hợp')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewBillDetails(null)}
            className="w-12 h-12 rounded-full hover:bg-surface-container transition-all flex items-center justify-center text-on-surface-variant hover:text-error"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">event</span>
                <span className="text-sm font-black uppercase tracking-widest">Kỳ hóa đơn</span>
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface">Tháng {bill.month}/{bill.year}</p>
                <p className="text-sm font-bold text-on-surface-variant mt-1">
                  Phòng: <span className="text-on-surface">{bill.roomNumberSnapshot || (contract?.room ? contract.room.roomNumber : '---')}</span>
                </p>
                <p className="text-xs font-medium text-on-surface-variant/70 mt-1 line-clamp-1">
                  📍 {contract?.room?.address || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">person</span>
                <span className="text-sm font-black uppercase tracking-widest">Khách thuê</span>
              </div>
              <div>
                <p className="text-xl font-black text-on-surface line-clamp-1">
                  {bill.tenantNameSnapshot || contract?.tenantName || 'Khách thuê cũ'}
                </p>
                <div className="space-y-1 mt-1">
                  <p className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">mail</span>
                    {contract?.tenantEmail || '---'}
                  </p>
                  <p className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">call</span>
                    {contract?.tenantPhone || '---'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/10">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                Bảng kê chi tiết
              </h4>
            </div>

            <div className="p-6 space-y-4">
              {(bill.billType === 'ROOM' || !bill.billType) && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface-variant">Tiền phòng cố định</span>
                    <span className="text-sm font-black text-on-surface">{roomAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface-variant">Phí gửi xe</span>
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{vehicleCount} xe × {parkingPrice.toLocaleString()}đ</span>
                    </div>
                    <span className="text-sm font-black text-on-surface">{parkingAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface-variant">Internet / Wifi</span>
                    <span className="text-sm font-black text-on-surface">{internetAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface-variant">Dịch vụ chung</span>
                    <span className="text-sm font-black text-on-surface">{serviceAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              )}

              {(bill.billType === 'UTILITY' || !bill.billType) && (
                <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface-variant">Tiền điện</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10">
                          {bill.oldElectricity ?? '?'} ⮕ {bill.newElectricity ?? '?'}
                        </span>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{elecUsage} ký × {elecPrice.toLocaleString()}đ</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-on-surface">{elecAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface-variant">Tiền nước</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10">
                          {bill.oldWater ?? '?'} ⮕ {bill.newWater ?? '?'}
                        </span>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{waterUsage} khối × {waterPrice.toLocaleString()}đ</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-on-surface">{waterAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="pt-6 border-t-2 border-dashed border-outline-variant/30 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Tổng cộng thanh toán</p>
                  <h3 className="text-sm font-bold text-on-surface-variant italic">
                    {bill.billType === 'ROOM' ? 'Hóa đơn tiền nhà' : (bill.billType === 'UTILITY' ? 'Hóa đơn điện nước' : 'Tổng hóa đơn kỳ này')}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-error tracking-tighter">{calculatedTotal.toLocaleString('vi-VN')}</span>
                  <span className="text-sm font-bold text-error ml-1">đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Section for TENANT - UNPAID */}
          {user.role === 'TENANT' && bill.status === 'UNPAID' && (
            <div className="bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 p-8 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-primary tracking-tight">Thanh toán nhanh qua VietQR</h4>
                <p className="text-xs font-bold text-on-surface-variant/70">Quét mã bằng ứng dụng Ngân hàng hoặc Ví điện tử để thanh toán tự động</p>
              </div>
              <div className="flex flex-col items-center gap-6">
                {(() => {
                  const bankName = contract?.room?.landlord?.bankName || 'MB';
                  const accNum = contract?.room?.landlord?.accountNumber || '000000000';
                  const accName = contract?.room?.landlord?.accountHolder || 'CHU NHA';
                  const addInfo = `THANHTOAN PHONG ${contract?.room?.roomNumber || ''}`.replace(/ /g, '%20');
                  return (
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-xl group-hover:bg-primary/20 transition-all"></div>
                      <img
                        src={`https://img.vietqr.io/image/${bankName}-${accNum}-compact.png?amount=${calculatedTotal}&addInfo=${addInfo}&accountName=${accName}`}
                        alt="VietQR"
                        className="relative w-64 rounded-3xl border-4 border-white shadow-2xl transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                  );
                })()}
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Tải lên minh chứng (Tối đa 3 ảnh) *</label>
                    <input
                      type="file" multiple accept="image/*"
                      onChange={(e) => {
                        if (e.target.files.length > 3) {
                          alert("Chỉ được chọn tối đa 3 ảnh!"); e.target.value = null;
                        } else { setProofFiles(e.target.files); }
                      }}
                      className="w-full p-4 bg-white border-2 border-dashed border-outline-variant rounded-2xl text-xs font-bold text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:border-primary/50 transition-all cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => handleUploadProof(bill.id)}
                    className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                    Gửi ảnh xác nhận thanh toán
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending for Tenant */}
          {user.role === 'TENANT' && bill.status === 'PENDING_CONFIRM' && (
            <div className="bg-secondary/10 p-8 rounded-[2rem] border border-secondary/20 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary animate-pulse">
                <span className="material-symbols-outlined text-4xl">verified_user</span>
              </div>
              <div>
                <h4 className="text-xl font-black text-secondary tracking-tight">Đã gửi minh chứng!</h4>
                <p className="text-sm font-bold text-on-surface-variant mt-1 leading-relaxed">Hệ thống đang chờ Chủ nhà kiểm tra và xác nhận giao dịch.</p>
              </div>
            </div>
          )}

          {/* Landlord Confirm */}
          {user.role === 'LANDLORD' && bill.status === 'PENDING_CONFIRM' && (
            <div className="bg-tertiary/5 p-8 rounded-[2rem] border-2 border-tertiary/20 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-2xl">pending_actions</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-tertiary tracking-tight">Xác nhận thanh toán</h4>
                  <p className="text-xs font-bold text-on-surface-variant/70">Kiểm tra kỹ ảnh minh chứng bên dưới trước khi xác nhận</p>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {(() => {
                  let images = [];
                  try { images = JSON.parse(bill.proofImages || "[]"); } catch (e) {}
                  return images.map((img, idx) => {
                    const fileName = img.replace(/^.*[\\/]/, '');
                    const imgSrc = `http://localhost:5000/uploads/${fileName}`;
                    return (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt={`Proof ${idx}`}
                        className="w-32 h-48 object-cover rounded-2xl border-2 border-white shadow-md hover:scale-105 transition-all cursor-zoom-in shrink-0"
                        onClick={() => window.open(imgSrc)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    );
                  });
                })()}
              </div>
              <button
                onClick={() => handlePayBill(bill.id).then(() => setViewBillDetails(null))}
                className="w-full py-5 bg-tertiary text-on-tertiary font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                Xác nhận đã nhận đủ tiền
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-outline-variant/10 bg-surface-container-lowest flex gap-4">
          <button
            onClick={() => setViewBillDetails(null)}
            className="flex-1 py-4 font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-all rounded-2xl border border-outline-variant/30"
          >
            Đóng cửa sổ
          </button>
          {bill.status === 'UNPAID' && user.role === 'LANDLORD' && (
            <button
              onClick={() => handlePayBill(bill.id).then(() => setViewBillDetails(null))}
              className="flex-[2] py-4 bg-secondary text-on-secondary font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Thu tiền mặt trực tiếp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailModal;
