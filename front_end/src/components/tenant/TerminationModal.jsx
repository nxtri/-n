import React from 'react';

/**
 * Component TerminationModal (Dành cho Khách thuê & Chủ nhà)
 * Chức năng: Hiển thị form để thông báo kết thúc hợp đồng (trả phòng hoặc lấy lại phòng).
 * - Kiểm tra điều kiện ngày báo trước (mặc định 30 ngày).
 * - Nhập lý do kết thúc.
 * - Gửi yêu cầu lên hệ thống để cập nhật trạng thái hợp đồng.
 */
const TerminationModal = ({
  showTerminateModal,        // State điều khiển việc hiển thị modal
  setShowTerminateModal,     // Hàm để đóng/mở modal
  terminateData,             // State chứa dữ liệu form (ngày dọn đi, lý do)
  setTerminateData,          // Hàm cập nhật state dữ liệu form
  handleRequestTermination,  // Hàm xử lý khi nhấn nút gửi thông báo (Submit form)
  getMinMoveOutDate,         // Hàm tính toán ngày tối thiểu có thể dọn đi (dựa trên quy định 30 ngày)
  userRole,                  // Vai trò người dùng (LANDLORD hoặc TENANT) để hiển thị nội dung phù hợp
}) => {
  // Nếu state show là false thì không render gì cả
  if (!showTerminateModal) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
      {/* Container chính của Modal */}
      <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
        
        {/* Nút đóng Modal (X) */}
        <button
          onClick={() => setShowTerminateModal(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors"
          title="Đóng"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Tiêu đề Modal */}
        <h3 className="m-0 text-error text-xl font-black border-b border-outline-variant/30 pb-4 mb-6 flex items-center gap-2 pr-12">
          <span className="material-symbols-outlined text-[24px]">warning</span>
          Thông báo {userRole === 'LANDLORD' ? 'Lấy lại phòng' : 'Trả phòng'}
        </h3>

        {/* Cảnh báo về quy định báo trước */}
        <p className="text-[14px] text-on-surface leading-relaxed mb-6 bg-error/5 p-4 rounded-xl border border-error/20">
          Theo quy định, bạn phải báo trước cho{' '}
          {userRole === 'LANDLORD' ? 'khách thuê' : 'chủ nhà'} ít nhất{' '}
          <strong className="text-error">30 ngày</strong>.
          Hệ thống sẽ gửi thông báo và đánh dấu phòng vào trạng thái chuẩn bị kết thúc.
        </p>

        {/* Form nhập liệu */}
        <form onSubmit={handleRequestTermination} className="flex flex-col gap-5">
          {/* 1. Chọn ngày dọn đi */}
          <div>
            <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">
              Ngày dự kiến dọn đi (Bắt buộc):
            </label>
            <input
              type="date"
              required
              min={getMinMoveOutDate()} // Giới hạn ngày chọn không được sớm hơn ngày quy định
              value={terminateData.moveOutDate}
              onChange={e => setTerminateData({ ...terminateData, moveOutDate: e.target.value })}
              className="w-full p-3.5 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            />
          </div>

          {/* 2. Nhập lý do */}
          <div>
            <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">
              Lý do (Tùy chọn):
            </label>
            <textarea
              rows="3"
              placeholder={userRole === 'LANDLORD' ? "VD: Cần lấy lại phòng để sửa chữa..." : "VD: Chuyển chỗ làm..."}
              value={terminateData.reason}
              onChange={e => setTerminateData({ ...terminateData, reason: e.target.value })}
              className="w-full p-4 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
            />
          </div>

          {/* 3. Các nút điều khiển */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowTerminateModal(false)}
              className="px-6 py-3 bg-surface-container-high text-on-surface-variant border-none rounded-xl cursor-pointer font-bold transition-all hover:bg-surface-container-highest"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-error text-white border-none rounded-xl cursor-pointer font-bold shadow-md shadow-error/20 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Xác nhận gửi thông báo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TerminationModal;
