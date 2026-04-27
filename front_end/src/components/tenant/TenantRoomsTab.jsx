import React from 'react';

/**
 * Component TenantRoomsTab
 * Chức năng: Quản lý các phòng và hợp đồng thuê hiện tại của khách thuê.
 * - Hiển thị danh sách các phòng đang thuê (Hợp đồng đang hiệu lực).
 * - Xem chi tiết hợp đồng điện tử (E-PDF).
 * - Thực hiện báo trước khi muốn dọn đi (trả phòng).
 * - Hủy yêu cầu trả phòng nếu thay đổi ý định.
 * - Thực hiện đánh giá phòng sau khi hợp đồng kết thúc.
 * - Khai báo tạm trú và tải lên minh chứng (ảnh giấy xác nhận).
 * - Hiển thị các tiện ích đi kèm của phòng.
 */
const TenantRoomsTab = ({
  user,                     // Thông tin người dùng hiện tại (để lọc hợp đồng của chính mình)
  contracts,                // Danh sách tất cả hợp đồng trong hệ thống
  myReviews,                // Danh sách các đánh giá mà khách thuê đã gửi
  handleViewRoomDetails,    // Hàm mở modal xem chi tiết phòng
  setTerminateData,         // Hàm cập nhật state dữ liệu trả phòng
  setShowTerminateModal,    // Hàm mở modal báo dọn đi
  setShowReviewModal,       // Hàm mở modal đánh giá
  setReviewData,            // Hàm cập nhật state dữ liệu đánh giá
  handleCancelTermination,  // Hàm xử lý hủy yêu cầu trả phòng
  residenceData,            // State dữ liệu khai báo tạm trú (ngày, địa điểm)
  setResidenceData,         // Hàm cập nhật state khai báo tạm trú
  residenceFiles,           // State lưu trữ file ảnh minh chứng tạm trú
  setResidenceFiles,        // Hàm cập nhật state file minh chứng
  handleUploadResidence,    // Hàm xử lý gửi minh chứng tạm trú lên server
  editingResidenceId,       // ID hợp đồng đang thực hiện sửa đổi thông tin tạm trú
  setEditingResidenceId,    // Hàm cập nhật ID đang sửa tạm trú
  setViewContract           // Hàm mở xem hợp đồng điện tử
}) => {
  // Lọc lấy các hợp đồng của khách thuê này
  const tenantContracts = contracts.filter(c => c.tenantId === user.id);
  // Sắp xếp: Hợp đồng đang hiệu lực (ACTIVE) lên đầu
  const sortedTenantContracts = [...tenantContracts].sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
    return 0;
  });

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8">
      {/* Tiêu đề trang và giới thiệu */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-xl font-display-xl text-3xl font-bold text-on-surface">Phòng đang thuê</h1>
          <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl">Quản lý các hợp đồng thuê nhà hiện tại, truy cập tài liệu pháp lý và thực hiện các yêu cầu liên quan.</p>
        </div>
        <div className="bg-secondary-container/20 border border-secondary-container/50 text-on-secondary-container px-5 py-2.5 rounded-full flex items-center gap-2.5 self-start md:self-auto shadow-sm">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-label-md font-bold text-secondary">Hợp đồng hợp lệ</span>
        </div>
      </div>

      <div className="space-y-12">
        {/* Trường hợp chưa có hợp đồng nào */}
        {sortedTenantContracts.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">meeting_room</span>
            <p className="text-on-surface-variant italic">Bạn chưa có hợp đồng thuê phòng nào.</p>
          </div>
        ) : (
          sortedTenantContracts.map(c => (
            <div key={c.id} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
              
              {/* Thẻ chi tiết phòng (Bên trái - Chiếm 2 cột) */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col relative group">
                  
                  {/* Ảnh bìa phòng và Gradient Overlay */}
                  <div className="h-80 w-full relative overflow-hidden bg-surface-container">
                    <img 
                      alt={`Phòng ${c.room?.roomNumber}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      src={c.room?.images?.[0] ? `http://localhost:5000/uploads/${c.room.images[0]}` : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000"} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    
                    {/* Thông tin hiển thị trên ảnh */}
                    <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end">
                      <div className="text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 
                            className="text-3xl font-black text-white tracking-tight cursor-pointer hover:text-primary-fixed-dim transition-colors"
                            onClick={() => c.room && handleViewRoomDetails(c.room)}
                          >
                            Phòng {c.room?.roomNumber}
                          </h2>
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
                            c.status === 'ACTIVE' ? 'bg-secondary/20 border-secondary/50 text-secondary-fixed' : 'bg-error/20 border-error/50 text-error-container'
                          }`}>
                            {c.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                          </span>
                        </div>
                        <p className="text-base flex items-center gap-2 opacity-90 font-medium">
                          <span className="material-symbols-outlined text-[20px] text-primary-fixed-dim">location_on</span>
                          {c.room?.houseNumber ? `${c.room.houseNumber}, ` : ''}{c.room?.address}
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/20 text-center min-w-[140px] shadow-2xl">
                        <p className="text-[10px] font-bold text-white/60 mb-1 uppercase tracking-widest">Giá thuê hàng tháng</p>
                        <p className="text-2xl font-black text-white leading-none">{Number(c.price || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Phần thông tin chi tiết hợp đồng và các nút hành động */}
                  <div className="p-8 bg-surface-container-lowest flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">calendar_month</span><p className="text-[11px] font-bold uppercase tracking-wider">Bắt đầu</p></div>
                        <p className="text-base text-on-surface font-bold pl-6">{c.startDate}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">event_available</span><p className="text-[11px] font-bold uppercase tracking-wider">Kết thúc</p></div>
                        <p className="text-base text-on-surface font-bold pl-6">{c.endDate}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">bed</span><p className="text-[11px] font-bold uppercase tracking-wider">Loại phòng</p></div>
                        <p className="text-base text-on-surface font-bold pl-6">{c.room?.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn' : 'Phòng trọ'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">fingerprint</span><p className="text-[11px] font-bold uppercase tracking-wider">Mã phòng</p></div>
                        <p className="text-base text-on-surface font-bold pl-6">{c.room?.roomCode || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Các nút bấm thao tác */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-outline-variant/30">
                      <button 
                        onClick={() => setViewContract(c)}
                        className="w-full sm:w-auto bg-primary text-on-primary hover:bg-surface-tint transition-all px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        Xem Hợp đồng điện tử
                      </button>
                      
                      {/* Nút báo trả phòng (chỉ hiện khi hợp đồng ACTIVE và chưa báo trả) */}
                      {c.status === 'ACTIVE' && !c.intendedMoveOutDate && (
                        <button 
                          onClick={() => { setTerminateData({ contractId: c.id, moveOutDate: '', reason: '' }); setShowTerminateModal(true); }}
                          className="w-full sm:w-auto bg-surface-container-high hover:bg-error/10 hover:text-error hover:border-error transition-all border border-outline-variant text-on-surface-variant px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 sm:ml-auto"
                        >
                          <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
                          Báo trước dọn đi
                        </button>
                      )}

                      {/* Nút đánh giá (hiện khi hợp đồng đã kết thúc) */}
                      {c.status !== 'ACTIVE' && (
                        <button 
                          onClick={() => {
                            const existingReview = myReviews.find(r => r.contractId === c.id);
                            if (existingReview) {
                              setReviewData({ contractId: c.id, rating: existingReview.rating, comment: existingReview.comment, isAnonymous: existingReview.isAnonymous, landlordReply: existingReview.landlordReply });
                            } else {
                              setReviewData({ contractId: c.id, rating: 5, comment: '', isAnonymous: false, landlordReply: null });
                            }
                            setShowReviewModal(true);
                          }}
                          className="w-full sm:w-auto bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-all px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 sm:ml-auto shadow-lg shadow-tertiary/20"
                        >
                          <span className="material-symbols-outlined text-[20px]">star</span>
                          {myReviews.some(r => r.contractId === c.id) ? 'Xem & Sửa đánh giá' : 'Đánh giá phòng'}
                        </button>
                      )}
                    </div>
                    
                    {/* Phần hiển thị thông báo khi có yêu cầu trả phòng hoặc chủ nhà đòi phòng */}
                    {c.status === 'ACTIVE' && c.intendedMoveOutDate && (
                      <div className={`mt-6 ${c.noticeGivenBy === 'LANDLORD' ? 'bg-error/5 border-error/30' : 'bg-error-container/20 border-error-container/40'} border-l-8 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm`}>
                        <div className="flex items-center gap-5 flex-1">
                          <div className={`w-14 h-14 rounded-full ${c.noticeGivenBy === 'LANDLORD' ? 'bg-error/10 text-error' : 'bg-error/10 text-error'} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-[32px] animate-pulse">
                              {c.noticeGivenBy === 'LANDLORD' ? 'priority_high' : 'pending_actions'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-black text-error leading-tight uppercase tracking-tight">
                              {c.noticeGivenBy === 'LANDLORD' ? '⚠️ CHỦ NHÀ YÊU CẦU LẤY LẠI PHÒNG' : 'BẠN ĐÃ GỬI YÊU CẦU TRẢ PHÒNG'}
                            </p>
                            <p className="text-sm text-on-surface-variant font-bold">
                              Dự kiến bàn giao lại phòng vào: <span className="text-error font-black border-b-2 border-error/20">{new Date(c.intendedMoveOutDate).toLocaleDateString('vi-VN')}</span>
                            </p>
                            {c.terminationReason && (
                              <div className="mt-2 bg-white/50 p-3 rounded-xl border border-outline-variant/20 italic">
                                <p className="text-[11px] font-bold text-on-surface-variant">Lý do: "{c.terminationReason}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {c.noticeGivenBy === 'TENANT' ? (
                          <button 
                            onClick={() => handleCancelTermination(c.id)}
                            className="w-full md:w-auto bg-error text-on-error px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-error/20 shrink-0"
                          >
                            Hủy yêu cầu trả phòng
                          </button>
                        ) : (
                          <div className="w-full md:w-auto px-6 py-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 shrink-0">
                            <span className="material-symbols-outlined text-error text-[18px]">info</span>
                            <span className="text-[10px] font-black text-error uppercase tracking-widest">Vui lòng liên hệ chủ nhà</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Thanh hiển thị các tiện ích của phòng */}
                <div className="bg-surface-container-low/50 rounded-2xl border border-outline-variant/30 p-6 flex flex-wrap justify-center md:justify-between items-center gap-8 shadow-inner">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">wifi</span></div>
                    <span className="text-sm font-bold opacity-80">Wifi tốc độ cao</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">local_laundry_service</span></div>
                    <span className="text-sm font-bold opacity-80">Máy giặt chung</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">ac_unit</span></div>
                    <span className="text-sm font-bold opacity-80">Điều hòa nhiệt độ</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">security</span></div>
                    <span className="text-sm font-bold opacity-80">An ninh 24/7</span>
                  </div>
                </div>
              </div>

              {/* Bảng điều khiển Hồ sơ & Tạm trú (Bên phải - Chiếm 1 cột) */}
              <div className="flex flex-col gap-6">
                <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 p-8 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-outline-variant/30">
                    <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder_shared</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-on-surface leading-tight">Hồ sơ & Tài liệu</h3>
                      <p className="text-xs text-on-surface-variant mt-1 font-medium">Bản ghi điện tử chính thức</p>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Hợp đồng thuê nhà điện tử */}
                    <div 
                      onClick={() => setViewContract(c)}
                      className="group relative flex items-center justify-between p-4 rounded-2xl border border-outline-variant/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-white transition-colors">
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">contract</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Hợp đồng thuê nhà</p>
                          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">E-PDF • Hiệu lực {c.startDate}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all text-[20px]">download</span>
                    </div>

                    {/* Thẻ Khai báo tạm trú */}
                    <div className={`p-6 rounded-3xl border-2 transition-all duration-300 ${
                      c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id 
                      ? 'border-secondary/20 bg-secondary/5' 
                      : 'border-tertiary-fixed/40 bg-tertiary-fixed/10'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[20px] ${c.residenceStatus === 'REGISTERED' ? 'text-secondary' : 'text-tertiary'}`}>
                            {c.residenceStatus === 'REGISTERED' ? 'verified_user' : 'report_problem'}
                          </span>
                          <h4 className="text-sm font-bold text-on-surface">Khai báo Tạm trú</h4>
                        </div>
                        {editingResidenceId === c.id && (
                          <button 
                            onClick={() => { setEditingResidenceId(null); setResidenceFiles(prev => ({ ...prev, [c.id]: [] })); }} 
                            className="text-[11px] font-bold text-error hover:underline"
                          >
                            Hủy bỏ
                          </button>
                        )}
                      </div>

                      {/* Hiển thị thông tin tạm trú đã đăng ký */}
                      {c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-on-surface-variant uppercase opacity-60">Nơi đăng ký</p>
                            <p className="text-sm font-bold text-on-surface">{c.residencePlace || 'Đã đăng ký'}</p>
                          </div>
                          {/* Hiển thị danh sách ảnh minh chứng */}
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {(() => {
                              let resImages = [];
                              try { resImages = Array.isArray(c.residenceImage) ? c.residenceImage : JSON.parse(c.residenceImage || '[]'); } catch (e) { resImages = []; }
                              return resImages.map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={`http://localhost:5000/uploads/${img.replace(/uploads[\\\/]/, '')}`} 
                                  alt="MC" 
                                  className="w-14 h-14 rounded-lg object-cover border border-outline-variant/30 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                  onClick={() => window.open(`http://localhost:5000/uploads/${img.replace(/uploads[\\\/]/, '')}`)}
                                />
                              ));
                            })()}
                          </div>
                          <button 
                            onClick={() => {
                              setEditingResidenceId(c.id);
                              setResidenceData(prev => ({ ...prev, [c.id]: { date: c.residenceDate || '', place: c.residencePlace || '' } }));
                            }}
                            className="w-full py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded-xl shadow-md shadow-secondary/10 hover:bg-secondary/90 transition-all"
                          >
                            Cập nhật minh chứng
                          </button>
                        </div>
                      ) : (
                        /* Form khai báo tạm trú mới hoặc cập nhật */
                        <form onSubmit={(e) => handleUploadResidence(e, c.id)} className="space-y-3">
                          <input 
                            type="date" 
                            required
                            value={residenceData[c.id]?.date || ''} 
                            onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), date: e.target.value}}))} 
                            className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="Cơ quan CA tiếp nhận..." 
                            value={residenceData[c.id]?.place || ''} 
                            onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), place: e.target.value}}))} 
                            className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="relative group">
                            <input 
                              type="file" multiple accept="image/*" 
                              onChange={(e) => setResidenceFiles(prev => ({ ...prev, [c.id]: Array.from(e.target.files) }))} 
                              className="w-full p-3 bg-white rounded-xl border border-dashed border-outline-variant group-hover:border-primary transition-all cursor-pointer text-[10px]"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full py-3 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-surface-tint transition-all"
                          >
                            Gửi minh chứng
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Thông tin hỗ trợ thêm */}
                  <div className="mt-8 pt-6 border-t border-outline-variant/30">
                    <div className="bg-surface-container-low p-4 rounded-2xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        Nếu bạn cần thư giới thiệu hoặc xác nhận cư trú cho mục đích khác, vui lòng gửi yêu cầu hỗ trợ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TenantRoomsTab;
