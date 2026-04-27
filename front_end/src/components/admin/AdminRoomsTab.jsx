import React from 'react';

/**
 * COMPONENT: AdminRoomsTab
 * Chức năng: Quản lý phòng trọ, hợp đồng và sự cố trên toàn hệ thống.
 * Các tính năng chính:
 * 1. Hiển thị danh sách tất cả phòng trọ kèm thông tin chủ nhà, trạng thái, đánh giá.
 * 2. Xử lý báo cáo vi phạm (báo xấu) từ người dùng đối với phòng trọ.
 * 3. Ẩn/Hiện phòng trọ nếu có vi phạm quy định.
 * 4. Xem nhanh danh sách các hợp đồng thuê phòng mới nhất.
 * 5. Theo dõi các phiếu báo cáo sự cố từ khách thuê trên toàn hệ thống.
 */
const AdminRoomsTab = ({ 
  rooms,                      // Danh sách tất cả phòng trọ
  contracts,                  // Danh sách các hợp đồng mới nhất
  incidents,                  // Danh sách các sự cố mới nhất
  navigate,                   // Hàm điều hướng trang
  handleViewReviews,          // Hàm mở modal xem đánh giá phòng
  setSelectedRoomReports,     // Hàm chọn phòng để xem chi tiết báo xấu
  handleToggleRoomVisibility  // Hàm ẩn/hiện phòng trọ
}) => {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
      
      {/* PHẦN 1: BẢNG DANH SÁCH TẤT CẢ PHÒNG TRỌ */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-primary">real_estate_agent</span> Tất Cả Phòng Trọ ({rooms.length})
        </h3>
        <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-outline-variant/30 no-scrollbar">
          <table className="w-full border-collapse text-left bg-surface-container-lowest">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 sticky top-0 z-10">
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Phòng</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Chủ nhà</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Ngày tạo</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Đánh giá</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Báo xấu</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="font-medium text-on-surface">
              {rooms.map(r => (
                <tr key={r.id} className={`border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50 ${r.deletedAt ? 'opacity-60 grayscale' : ''}`}>
                  <td className="p-4">
                    <span 
                      onClick={() => navigate(`/room/${r.id}`)}
                      className="text-primary font-bold cursor-pointer hover:underline flex items-center gap-2"
                      title="Xem chi tiết phòng"
                    >
                      <span className="material-symbols-outlined text-[18px]">door_open</span> Phòng {r.roomNumber}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-on-surface">{r.landlord?.fullName}</div>
                    <div className="text-[12px] text-on-surface-variant mt-1 flex flex-col gap-0.5">
                      <span>{r.landlord?.email}</span>
                      <span className="font-bold opacity-80">{r.landlord?.phone}</span>
                    </div>
                  </td>
                  <td className="p-4 text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4">
                    {r.deletedAt ? (
                      <span className="font-bold text-error flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">delete</span> Đã xóa</span>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${r.status === 'AVAILABLE' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {r.status === 'AVAILABLE' ? 'Phòng Trống' : 'Đã Thuê'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className={`font-black text-[15px] flex items-center justify-center gap-1 ${Number(r.avgRating) >= 4 ? 'text-success' : Number(r.avgRating) >= 2 ? 'text-secondary' : 'text-error'}`}>
                      <span className="material-symbols-outlined text-[18px] fill-1">star</span> {r.avgRating || 0}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <small className="text-on-surface-variant opacity-70 font-bold">({r.reviewCount || 0} lượt)</small>
                      <button 
                        onClick={() => handleViewReviews(r.id, r.roomNumber)}
                        className="bg-transparent border-none text-primary cursor-pointer text-[12px] font-bold hover:underline">
                        Xem đánh giá
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    { (() => {
                      const pendingCount = r.reports?.filter(rep => rep.status === 'PENDING').length || 0;
                      return (
                        <div className={`font-bold flex items-center justify-center gap-1.5 ${pendingCount > 0 ? 'text-error bg-error/10 px-2 py-1 rounded-lg' : 'text-on-surface-variant'}`}>
                          {pendingCount > 0 ? <><span className="material-symbols-outlined text-[16px]">warning</span> {pendingCount} chờ xử lý</> : `${r.reports?.length || 0} báo cáo`}
                        </div>
                      );
                    })() }
                    {(r.reports?.length || 0) > 0 && (
                      <button 
                        onClick={() => setSelectedRoomReports({ roomNumber: r.roomNumber, reports: r.reports, roomId: r.id })}
                        className="bg-transparent border-none text-primary cursor-pointer text-[12px] font-bold mt-2 hover:underline">
                        Xem chi tiết
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggleRoomVisibility(r.id, r.isHidden)}
                      className={`px-3 py-1.5 rounded-lg border cursor-pointer font-bold transition-all hover:scale-105 flex items-center gap-1.5 mx-auto ${r.isHidden ? 'border-error/20 bg-error/10 text-error hover:bg-error hover:text-white' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{r.isHidden ? 'visibility' : 'visibility_off'}</span>
                      {r.isHidden ? 'Mở ẩn' : 'Ẩn phòng'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PHẦN 2: DANH SÁCH HỢP ĐỒNG GẦN ĐÂY */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col h-full">
          <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">description</span> Hợp Đồng Gần Đây
          </h3>
          <div className="max-h-[350px] overflow-y-auto no-scrollbar flex-1">
            <div className="flex flex-col gap-4">
              {contracts.map(c => (
                <div key={c.id} className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low hover:border-primary/20 transition-all flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                     <div className="flex flex-col gap-1">
                       <span className="text-primary font-black flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">door_open</span> Phòng: {c.room?.roomNumber}</span>
                       <span className="text-on-surface font-bold text-[15px]">{c.tenantName}</span>
                     </div>
                     <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${c.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                       {c.status}
                     </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-outline-variant/10 pt-3">
                     <span className="text-[12px] text-on-surface-variant opacity-70 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                     <span className="font-black text-on-surface text-[15px]">{c.price.toLocaleString()}đ<span className="text-[11px] font-medium opacity-60">/tháng</span></span>
                  </div>
                </div>
              ))}
              {contracts.length === 0 && <div className="text-center p-8 text-on-surface-variant opacity-60 font-medium italic">Không có hợp đồng nào.</div>}
            </div>
          </div>
        </div>

        {/* PHẦN 3: DANH SÁCH SỰ CỐ MỚI NHẤT */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col h-full">
          <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">engineering</span> Phiếu Sự Cố Gần Đây
          </h3>
          <div className="max-h-[350px] overflow-y-auto no-scrollbar flex-1">
            <div className="flex flex-col gap-4">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low hover:border-primary/20 transition-all flex flex-col gap-3">
                   <div className="flex flex-col gap-1.5">
                     <span className="text-primary font-black flex items-center gap-1.5 text-[13px]"><span className="material-symbols-outlined text-[16px]">door_open</span> Khách Phòng {inc.room?.roomNumber}</span>
                     <span className="text-on-surface font-bold text-[15px] leading-snug">{inc.title}</span>
                   </div>
                   <div className="flex justify-between items-center border-t border-outline-variant/10 pt-3">
                     <span className="text-[12px] text-on-surface-variant opacity-70 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(inc.createdAt).toLocaleDateString('vi-VN')}</span>
                     <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${inc.status === 'Pending' ? 'bg-secondary/10 text-secondary' : inc.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                       {inc.status}
                     </span>
                   </div>
                </div>
              ))}
              {incidents.length === 0 && <div className="text-center p-8 text-on-surface-variant opacity-60 font-medium italic">Không có sự cố nào.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRoomsTab;
