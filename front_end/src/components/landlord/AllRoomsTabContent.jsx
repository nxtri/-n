import React from 'react';
import RoomMetricsCards from './RoomMetricsCards';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component AllRoomsTabContent
 * Chức năng: Hiển thị danh sách tất cả các phòng trọ của chủ nhà trong Dashboard.
 * Bao gồm: Các thẻ chỉ số (Metrics), bộ lọc theo trạng thái, thanh tìm kiếm, và lưới danh sách phòng (Room Grid).
 */
const AllRoomsTabContent = ({ 
  activeTab,             // Tab hiện tại (ALL_ROOMS, AVAILABLE, RENTED, ...)
  setActiveTab,          // Hàm để thay đổi tab khi nhấn vào các nút lọc
  displayedRooms,        // Danh sách các phòng đã được lọc để hiển thị
  roomSearchTerm,        // Từ khóa tìm kiếm hiện tại
  setRoomSearchTerm,     // Hàm cập nhật từ khóa tìm kiếm
  metrics,               // Dữ liệu thống kê (tổng số phòng, đang trống, ...)
  setDepositModal,       // Hàm mở modal nhận cọc
  setRoomToEdit,         // Hàm set phòng cần sửa
  setShowRoomFormModal,  // Hàm mở modal thêm/sửa phòng
  handleEditRoomClick,   // Hàm xử lý khi nhấn nút sửa phòng
  handleToggleRoomVisibility, // Hàm ẩn/hiện phòng
  handleDeleteRoom,      // Hàm xóa phòng
  handleNewContractClick, // Hàm mở form ký hợp đồng mới
  handleEditContractClick, // Hàm mở form sửa hợp đồng
  setTerminateData,      // Hàm set dữ liệu trả phòng
  setShowTerminateModal, // Hàm mở modal xác nhận trả phòng
  setContractForBill,    // Hàm set hợp đồng để tạo hóa đơn
  handleViewRoomDetails, // Hàm mở modal xem chi tiết phòng
  setViewContract,       // Hàm xem chi tiết hợp đồng
  handleEndLease,        // Hàm xử lý trả phòng nhanh
  handleCancelTermination, // Hàm hủy yêu cầu trả phòng
  roomApi,               // Đối tượng gọi API phòng
  fetchRooms             // Hàm tải lại danh sách phòng từ server
}) => {
  const { contracts } = useDashboardContext();

  // Kiểm tra xem tab hiện tại có thuộc nhóm quản lý phòng không
  const isRoomsTab = activeTab === 'ALL_ROOMS' || activeTab === 'AVAILABLE' || activeTab === 'RENTED' || activeTab === 'MAINTENANCE' || activeTab === 'UPCOMING' || activeTab === 'DEPOSITED' || activeTab === 'HIDDEN';
  if (!isRoomsTab) return null;

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8 space-y-12 font-['Inter']">
      {/* 1. Khu vực hiển thị các thẻ chỉ số tổng quan (Tổng số phòng, Đang trống, Doanh thu dự kiến...) */}
      <RoomMetricsCards metrics={metrics} />

      {/* 2. Thanh hành động: Bao gồm bộ lọc trạng thái và thanh tìm kiếm */}
      <div className="flex flex-col gap-6 bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/30 shadow-sm transition-all duration-300 hover:shadow-md">
        
        {/* Bộ lọc theo Category (Tất cả, Đang thuê, Trống, Đã cọc...) */}
        <div className="flex flex-wrap items-center gap-3 pb-2">
          {[
            { id: 'ALL_ROOMS', label: 'Tất cả phòng', count: metrics.total, icon: 'list_alt' },
            { id: 'RENTED', label: 'Đang cho thuê', count: metrics.occupied, icon: 'person' },
            { id: 'AVAILABLE', label: 'Phòng trống', count: metrics.available, icon: 'meeting_room' },
            { id: 'DEPOSITED', label: 'Phòng đã cọc', count: metrics.deposited, icon: 'lock' },
            { id: 'UPCOMING', label: 'Sắp trống / Đăng tin', count: metrics.upcoming, icon: 'campaign' },
            { id: 'HIDDEN', label: 'Phòng bị ẩn', count: metrics.hidden, icon: 'visibility_off' },
            { id: 'MAINTENANCE', label: 'Đang bảo trì', count: metrics.maintenance, icon: 'build' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:translate-y-[-2px]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`ml-1 text-[11px] opacity-60 font-bold ${activeTab === tab.id ? 'text-white' : ''}`}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tìm kiếm và Nút thêm phòng mới */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-outline-variant/20">
          <div className="relative w-full md:max-w-md group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px]">search</span>
            <input 
              type="text" 
              placeholder="Tìm mã phòng, địa chỉ hoặc tên khách thuê..." 
              value={roomSearchTerm}
              onChange={(e) => setRoomSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:opacity-50"
            />
            {roomSearchTerm && (
              <button onClick={() => setRoomSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
          
          <button 
            onClick={() => { setRoomToEdit(null); setShowRoomFormModal(true); }}
            className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-primary-container hover:text-primary hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px] font-bold">add_circle</span>
            THÊM PHÒNG MỚI
          </button>
        </div>
      </div>

      {/* 3. Lưới hiển thị danh sách các phòng (Dưới dạng Card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        {displayedRooms.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">folder_open</span>
            <p className="text-on-surface-variant italic font-medium">Không tìm thấy phòng nào phù hợp.</p>
          </div>
        ) : (
          displayedRooms.map((room) => {
            const activeContract = contracts.find(c => c.roomId == room.id && c.status === 'ACTIVE');
            const isReturningSoon = activeContract && !!activeContract.intendedMoveOutDate;
            
            const statusConfig = {
              AVAILABLE: { label: 'Đang trống', color: 'bg-secondary', icon: 'meeting_room' },
              RENTED: { label: 'Đã thuê', color: 'bg-primary', icon: 'person' },
              MAINTENANCE: { label: 'Bảo trì', color: 'bg-error', icon: 'build' },
              DEPOSITED: { label: 'Đã cọc', color: 'bg-tertiary', icon: 'lock' }
            };
            const config = statusConfig[room.status] || statusConfig.AVAILABLE;

            return (
              <div key={room.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group flex flex-col">
                
                {/* Phần Hình ảnh phòng */}
                <div 
                  className="relative h-56 overflow-hidden bg-surface-container cursor-pointer"
                  onClick={() => handleViewRoomDetails(room)}
                >
                  {(() => {
                    let images = [];
                    try { images = JSON.parse(room.images) || []; } catch(e) {}
                    return images.length > 0 ? (
                      <img 
                        src={`http://localhost:5000/uploads/${images[0]}`} 
                        alt={room.roomNumber} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant gap-2 bg-surface-container">
                        <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                        <p className="text-xs font-bold uppercase tracking-widest">Chưa có ảnh</p>
                      </div>
                    );
                  })()}
                  <div className={`absolute top-4 left-4 ${config.color} text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                    <span className="material-symbols-outlined text-[14px] font-black">{config.icon}</span>
                    {config.label}
                  </div>
                  {/* Hiển thị điểm đánh giá trung bình */}
                  {room.reviewCount > 0 && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-primary shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                      {room.avgRating}
                    </div>
                  )}

                  {/* Price Overlay */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                    <p className="text-primary font-price-tag text-lg leading-none">
                      {(room.price || 0).toLocaleString()} đ<span className="text-xs font-normal text-on-surface-variant ml-1">/tháng</span>
                    </p>
                  </div>
                </div>

                {/* Phần Thông tin chi tiết và các Nút hành động */}
                <div className="p-6 flex flex-col flex-1 space-y-6">
                  {/* Tên và Mã phòng */}
                  <div>
                    <h3 
                      className="font-headline-md text-headline-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => handleViewRoomDetails(room)}
                    >
                      {(room.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(room.roomNumber)) ? 'Nhà ' : 'Phòng '}{room.roomNumber}
                    </h3>
                    {room.roomCode && (
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50 mt-0.5">
                        Mã: {room.roomCode}
                      </p>
                    )}
                  </div>

                  {/* Diện tích, Sức chứa và Địa chỉ */}
                  <div className="space-y-3 pb-6 border-b border-outline-variant/20">
                    <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg text-primary">square_foot</span>
                        {room.area || '—'} m²
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg text-primary">group</span>
                        {room.maxOccupants || '—'} người
                      </div>
                    </div>
                    {/* Địa chỉ có hiệu ứng chữ chạy (Marquee) nếu quá dài */}
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm marquee-container">
                      <span className="material-symbols-outlined text-lg text-primary flex-shrink-0">location_on</span>
                      <div className="marquee-content">
                        <span>{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</span>
                        {(room.address?.length > 20 || room.houseNumber) && (
                          <span className="ml-8">{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Khu vực thông tin thuê phòng / cọc và các nút điều khiển */}
                  <div className="space-y-4 flex-1 flex flex-col justify-end">
                    
                    {/* Thông báo khách dọn đi hoặc chủ nhà lấy lại phòng */}
                    {room.status === 'RENTED' && activeContract && isReturningSoon && (
                      <div className={`${activeContract.noticeGivenBy === 'LANDLORD' ? 'bg-primary/10 border-primary' : 'bg-tertiary/10 border-tertiary'} border-l-4 p-4 rounded-2xl mb-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${activeContract.noticeGivenBy === 'LANDLORD' ? 'bg-primary/20 text-primary' : 'bg-tertiary/20 text-tertiary'} flex items-center justify-center shrink-0 shadow-sm`}>
                            <span className="material-symbols-outlined text-[20px] font-black animate-pulse">
                              {activeContract.noticeGivenBy === 'LANDLORD' ? 'outbound' : 'hail'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-black ${activeContract.noticeGivenBy === 'LANDLORD' ? 'text-primary' : 'text-tertiary'} uppercase tracking-widest leading-tight`}>
                              {activeContract.noticeGivenBy === 'LANDLORD' ? 'Bạn yêu cầu lấy lại' : 'Khách yêu cầu trả phòng'}
                            </p>
                            <p className="text-sm font-black text-on-surface truncate">
                              Ngày đi: <span className="text-error font-black border-b border-error/20">{new Date(activeContract.intendedMoveOutDate).toLocaleDateString('vi-VN')}</span>
                            </p>
                          </div>
                        </div>
                        {activeContract.terminationReason && (
                          <div className="mt-3 pt-3 border-t border-outline-variant/10">
                            <p className="text-[10px] font-bold text-on-surface-variant italic leading-relaxed line-clamp-2">
                              " {activeContract.terminationReason} "
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hiển thị khách thuê hiện tại */}
                    {room.status === 'RENTED' && activeContract ? (
                      <div className="space-y-3">
                        {/* Banner Ghi chú Cọc nếu có người cọc mới khi khách cũ sắp đi */}
                        {room.depositNote && (
                          <div className="bg-emerald-500 border-2 border-emerald-400/20 p-4 rounded-2xl animate-in zoom-in duration-500 shadow-lg shadow-emerald-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125"></div>
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                                <span className="material-symbols-outlined text-[22px] font-black">lock_person</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-tight">Đã nhận cọc giữ chỗ mới</p>
                                <p className="text-sm font-black text-white truncate italic">
                                  "{room.depositNote}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px] fill-1">person</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-40 leading-tight">Đang thuê</p>
                            <p className="text-sm font-black text-on-surface truncate">{activeContract.tenantName}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setViewContract(activeContract)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all" title="Xem Hợp đồng">
                            <span className="material-symbols-outlined text-[20px]">description</span>
                          </button>
                        </div>
                        </div>
                      </div>
                    ) : (
                      /* Hiển thị ghi chú cọc khi phòng trống */
                      <div className="py-2">
                        <p className="text-xs text-on-surface-variant font-bold opacity-40 italic">
                          {room.status === 'AVAILABLE' ? '— Sẵn sàng đón khách mới' : room.status === 'DEPOSITED' ? '— Đã nhận đặt cọc giữ chỗ' : room.status === 'RENTED' ? '— Đang cập nhật thông tin thuê' : '— Đang trong quá trình bảo trì'}
                        </p>
                        {room.depositNote && (
                          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl animate-in fade-in duration-500">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Thông tin cọc:</p>
                                <p className="text-sm font-bold text-emerald-700 truncate italic">"{room.depositNote}"</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* HÀNG CÁC NÚT ĐIỀU KHIỂN (Thay đổi tùy theo trạng thái phòng) */}
                    <div className="grid grid-cols-2 gap-3">
                      {room.status === 'AVAILABLE' ? (
                        <>
                          <button onClick={() => handleNewContractClick(room)} className="col-span-2 py-3.5 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            ✍️ Ký Hợp Đồng
                          </button>
                          <button onClick={() => handleEditRoomClick(room)} className="py-3 bg-surface-container-high text-on-surface-variant rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">edit</span> Sửa
                          </button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="py-3 bg-error/10 text-error rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">delete</span> Xóa
                          </button>
                          <button onClick={() => setDepositModal({ show: true, roomId: room.id, note: room.depositNote || '' })} className="py-3 bg-tertiary/10 text-tertiary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">
                            {room.depositNote ? '📝 Cập nhật cọc' : '💰 Nhận cọc'}
                          </button>
                          <button onClick={() => roomApi.updateStatus(room.id, 'MAINTENANCE').then(fetchRooms)} className="py-3 bg-error/10 text-error rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">build</span> Bảo trì
                          </button>
                        </>
                      ) : room.status === 'RENTED' ? (
                        <>
                          {/* Chốt điện nước (Nếu không phải thanh toán trực tiếp) */}
                          {!Boolean(activeContract?.isDirectUtilityPayment) && (
                            <button onClick={() => setContractForBill(activeContract)} className="col-span-2 py-3.5 bg-tertiary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all">
                              🧾 Chốt Điện Nước
                            </button>
                          )}
                          <button onClick={() => handleEditContractClick(activeContract)} className="py-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white transition-all">Sửa HĐ</button>
                          <button onClick={() => handleEndLease(room.id)} className="py-3 bg-error/10 text-error border border-error/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all">Trả phòng</button>
                          
                          {/* Các nút xử lý khi khách sắp dọn đi */}
                          {isReturningSoon ? (
                            <>
                              <button onClick={() => setDepositModal({ show: true, roomId: room.id, note: room.depositNote || '' })} className="col-span-2 py-3 bg-tertiary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-tertiary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                {room.depositNote ? 'Cập nhật cọc giữ chỗ' : 'Nhận cọc giữ chỗ mới'}
                              </button>
                              <button onClick={() => handleCancelTermination(activeContract.id)} className="col-span-2 py-3 bg-outline-variant text-on-surface-variant rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container transition-all">Hủy lịch trả</button>
                            </>
                          ) : (
                            <button onClick={() => { setTerminateData({ contractId: activeContract.id, moveOutDate: '', reason: '' }); setShowTerminateModal(true); }} className="col-span-2 py-3 bg-tertiary/10 text-tertiary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">⚠️ Thông báo lấy lại</button>
                          )}
                        </>
                      ) : (
                        /* Nút hoàn tất bảo trì */
                        <button onClick={() => roomApi.updateStatus(room.id, 'AVAILABLE').then(fetchRooms)} className="col-span-2 py-3.5 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all">
                          ✅ Hoàn tất bảo trì
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllRoomsTabContent;