import React from 'react';

/**
 * COMPONENT: ReportDetailModal
 * Chức năng: Hiển thị danh sách các báo cáo vi phạm (báo xấu) của một phòng trọ cụ thể.
 * Các tính năng chính:
 * 1. Xem chi tiết từng báo cáo (Lý do, mô tả, người báo cáo, thời gian).
 * 2. Cập nhật trạng thái từng báo cáo sang "Đã giải quyết".
 * 3. Nút "Giải quyết toàn bộ" để xử lý nhanh tất cả báo cáo đang chờ.
 */
const ReportDetailModal = ({ 
  selectedRoomReports,     // Đối tượng chứa dữ liệu phòng và danh sách báo cáo
  setSelectedRoomReports,  // Hàm đóng modal (set null)
  handleResolveAllReports, // Hàm xử lý giải quyết tất cả báo cáo của phòng này
  handleUpdateReportStatus // Hàm xử lý cập nhật trạng thái cho một báo cáo cụ thể
}) => {
  if (!selectedRoomReports) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
      <div className="bg-surface-container-lowest w-full max-w-[650px] max-h-[85vh] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
        <button 
          onClick={() => setSelectedRoomReports(null)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors" title="Đóng">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6 pr-12">
          <h3 className="m-0 text-on-surface text-xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-error">campaign</span> Báo xấu: Phòng {selectedRoomReports.roomNumber}
          </h3>
          {selectedRoomReports.reports.some(r => r.status === 'PENDING') && (
            <button
              onClick={() => handleResolveAllReports(selectedRoomReports.roomId)}
              className="bg-success text-xl border-none px-4 py-2 rounded-xl font-bold text-[14px] cursor-pointer shadow-md shadow-success/20 hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span> Giải quyết toàn bộ
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          <div className="flex flex-col gap-4">
            {selectedRoomReports.reports.map((report, idx) => (
              <div key={idx} className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/50 flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex justify-between mb-3 items-center">
                  <div className="flex items-center gap-3">
                    <strong className={`text-[15px] ${report.status === 'PENDING' ? 'text-error' : 'text-success'}`}>{report.reason}</strong>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${report.status === 'PENDING' ? 'bg-error/10 text-error border-error/20' : 'bg-success/10 text-success border-success/20'}`}>
                      {report.status === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'}
                    </span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                {report.description && (
                  <p className="text-[14px] text-on-surface m-0 mb-4 leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                    {report.description}
                  </p>
                )}
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-dashed border-outline-variant/30">
                  <div className="text-[13px] text-on-surface-variant">
                    Báo cáo bởi: <strong className="text-on-surface">{report.fullName}</strong> - SĐT: <strong className="text-on-surface">{report.phoneNumber}</strong>
                  </div>
                  {report.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                      className="bg-primary text-white border-none px-4 py-2 rounded-xl text-[13px] cursor-pointer font-bold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span> Đã xử lý xong
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
