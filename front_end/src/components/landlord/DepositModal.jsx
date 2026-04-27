import React from 'react';

/**
 * Component DepositModal
 * Chức năng: Hiển thị cửa sổ ghi chú khi chủ nhà nhận tiền cọc giữ chỗ của khách.
 * - Cho phép lưu thông tin người cọc, số tiền, ngày nhận... dưới dạng ghi chú.
 * - Tự động cập nhật trạng thái phòng thành "Đã cọc" (DEPOSITED).
 * - Có nút để xóa ghi chú cọc khi khách dọn vào hoặc hủy cọc.
 */
const DepositModal = ({ 
  depositModal,        // State chứa thông tin modal { show, roomId, note }
  setDepositModal,     // Hàm để đóng/mở và cập nhật state modal
  handleSaveDeposit,   // Hàm xử lý lưu thông tin cọc
  handleDeleteDeposit  // Hàm xử lý xóa thông tin cọc
}) => {
  if (!depositModal.show) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-outline-variant/30 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-4xl">lock_person</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-on-surface tracking-tight">Ghi chú Nhận cọc / Giữ chỗ</h3>
            <p className="text-sm text-on-surface-variant font-bold opacity-60">Phòng sẽ tự động ẩn khỏi danh sách hiển thị</p>
          </div>
        </div>

        <div className="p-5 bg-surface-container-low rounded-2xl border-l-4 border-primary/50 text-xs font-bold text-on-surface-variant leading-relaxed opacity-80">
          <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1 text-primary">info</span>
          Lưu ý: Khách cũ vẫn có thể sinh hoạt bình thường. Phòng chỉ bị ẩn đối với khách mới tìm kiếm trên trang chủ.
        </div>

        <form onSubmit={handleSaveDeposit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-50">Nội dung ghi chú *</label>
            <textarea
              rows="5"
              autoFocus
              placeholder="Ví dụ: Anh Hưng số 098... cọc 2 triệu, hẹn mùng 5/6 chuyển vào..."
              value={depositModal.note}
              onChange={e => setDepositModal({ ...depositModal, note: e.target.value })}
              className="w-full p-6 bg-white border-2 border-outline-variant rounded-3xl text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleDeleteDeposit}
              className="w-full sm:w-auto px-6 py-3.5 bg-error/10 text-error rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">no_accounts</span>
              Xóa cọc (Mở lại phòng)
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDepositModal({ show: false, roomId: null, note: '' })}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-surface-container-high text-on-surface-variant rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-10 py-3.5 bg-primary text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95"
              >
                Lưu ghi chú 💾
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
